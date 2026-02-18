program privlend.aleo {

    @noupgrade
    async constructor() {}

    // =========================
    // Public on-chain state
    // =========================
    mapping loan_counter: u32 => u32;     // key 0u32 holds global counter
    mapping loan_active: u32 => bool;     // loan_id -> active?
    mapping loan_owner: u32 => address;   // loan_id -> borrower (public)
    mapping loan_deadline: u32 => u32;    // loan_id -> deadline block

    // =========================
    // Private records
    // =========================
    record CreditTier {
        owner: address,
        tier: u8,      // 0=A, 1=B, 2=C
        nonce: field,  // secret
    }

    record Loan {
        owner: address,      // borrower
        lender: address,     // lender
        loan_id: u32,
        principal: u64,      // private
        collateral: u64,     // private
        tier: u8,            // private
        interest_bps: u16,   // private (MVP, not enforced yet)
        start_block: u32,    // provided by frontend (MVP)
        duration_blocks: u32,
        repaid: u64,
        status: u8,          // 0=active, 2=repaid, 3=liquidated
    }

    record Collateral {
        owner: address,
        loan_id: u32,
        amount: u64,
        locked_until: u32,
    }

    // =========================
    // Constants
    // =========================
    const MIN_DURATION: u32 = 1440u32;
    const MAX_DURATION: u32 = 525600u32;
    const MAX_INTEREST_BPS: u16 = 2000u16;

    // =========================
    // 1) Private: create a credit tier record
    // =========================
    transition create_credit_tier(tier: u8, nonce: field) -> CreditTier {
        assert(tier < 3u8);
        let ct: CreditTier = CreditTier { owner: self.caller, tier, nonce };
        return ct;
    }

    // =========================
    // 2) Private: create loan + collateral records (NO mappings, NO block.height)
    // =========================
    transition create_loan_private(
        loan_id: u32,
        start_block: u32,
        lender: address,
        credit: CreditTier,
        principal: u64,
        collateral: u64,
        interest_bps: u16,
        duration_blocks: u32
    ) -> (Loan, Collateral) {

        let borrower: address = self.caller;

        // checks
        assert(principal > 0u64);
        assert(collateral > 0u64);
        assert(duration_blocks >= MIN_DURATION);
        assert(duration_blocks <= MAX_DURATION);
        assert(interest_bps <= MAX_INTEREST_BPS);

        // credit must belong to borrower
        assert(credit.owner == borrower);

        let locked_until: u32 = start_block + duration_blocks;

        let loan: Loan = Loan {
            owner: borrower,
            lender,
            loan_id,
            principal,
            collateral,
            tier: credit.tier,
            interest_bps,
            start_block,
            duration_blocks,
            repaid: 0u64,
            status: 0u8,
        };

        let col: Collateral = Collateral {
            owner: borrower,
            loan_id,
            amount: collateral,
            locked_until,
        };

        return (loan, col);
    }

    // =========================
    // 3) Public: register loan on-chain (mappings)  ✅ async, NO records
    // =========================
    async transition register_loan_public(
        loan_id: u32,
        borrower: address,
        start_block: u32,
        duration_blocks: u32
    ) -> Future {

        // borrower must be the caller (prevents anyone registering your loan)
        assert(borrower == self.caller);

        // capture borrower for async block (can't use self.caller inside async block)
        let b: address = borrower;

        let f: Future = async {
            let exists: bool = loan_active.get_or_use(loan_id, false);
            assert(!exists);

            loan_active.set(loan_id, true);
            loan_owner.set(loan_id, b);
            loan_deadline.set(loan_id, start_block + duration_blocks);

            // keep counter monotonic
            let current: u32 = loan_counter.get_or_use(0u32, 0u32);
            if (loan_id > current) {
                loan_counter.set(0u32, loan_id);
            }
        };

        return f;
    }

    // =========================
    // 4) Private: repay loan record (MVP: repay principal fully)
    // =========================
    transition repay_private(loan: Loan, payment: u64) -> Loan {
        let borrower: address = self.caller;

        assert(loan.status == 0u8);
        assert(borrower == loan.owner);

        // MVP: require full principal
        assert(payment >= loan.principal);

        let updated: Loan = Loan {
            owner: loan.owner,
            lender: loan.lender,
            loan_id: loan.loan_id,
            principal: loan.principal,
            collateral: loan.collateral,
            tier: loan.tier,
            interest_bps: loan.interest_bps,
            start_block: loan.start_block,
            duration_blocks: loan.duration_blocks,
            repaid: loan.principal,
            status: 2u8,
        };

        return updated;
    }

    // =========================
    // 5) Public: mark repaid (turn off active) ✅ async, NO records
    // =========================
    async transition mark_repaid_public(loan_id: u32) -> Future {
        let caller: address = self.caller;

        let f: Future = async {
            let owner: address = loan_owner.get(loan_id);
            assert(owner == caller);

            loan_active.set(loan_id, false);
        };

        return f;
    }

    // =========================
    // 6) Public: liquidate if expired ✅ async, NO records
    // =========================
    async transition liquidate_public(loan_id: u32) -> Future {
        let f: Future = async {
            let deadline: u32 = loan_deadline.get(loan_id);
            assert(block.height > deadline);

            loan_active.set(loan_id, false);
        };

        return f;
    }
}
