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
    //     Private records
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
        interest_bps: u16,   // private
        start_block: u32,    // provided by frontend
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
    //       Constants
    // =========================
    const MIN_DURATION: u32 = 1440u32;          // ~10 days
    const MAX_DURATION: u32 = 525600u32;        // ~1 year
    const MAX_INTEREST_BPS: u16 = 2000u16;      // 20%
    const BASIS_POINTS_DIVISOR: u16 = 10000u16; // 100% = 10000 bps
    const MIN_COLLATERAL_RATIO: u64 = 150u64;   // 150% minimum collateral

    // =========================
    // 1) Private: create a credit tier record
    // =========================
    transition create_credit_tier(tier: u8, nonce: field) -> CreditTier {
        // Validate tier (0, 1, or 2)
        assert(tier < 3u8);
        
        let ct: CreditTier = CreditTier { 
            owner: self.caller, 
            tier, 
            nonce 
        };
        
        return ct;
    }

    // ============================================
    // 2) Private: create loan + collateral records
    // ============================================
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

        // Input validation
        assert(principal > 0u64);
        assert(collateral > 0u64);
        assert(duration_blocks >= MIN_DURATION);
        assert(duration_blocks <= MAX_DURATION);
        assert(interest_bps <= MAX_INTEREST_BPS);

        // Validate collateral ratio (minimum 150%)
        let required_collateral: u64 = principal * MIN_COLLATERAL_RATIO / 100u64;
        assert(collateral >= required_collateral);

        // Credit tier must belong to borrower
        assert(credit.owner == borrower);
        assert(credit.tier < 3u8);

        // Calculate when collateral unlocks
        let locked_until: u32 = start_block + duration_blocks;

        // Create loan record
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
            status: 0u8, // active
        };

        // Create collateral record
        let col: Collateral = Collateral {
            owner: borrower,
            loan_id,
            amount: collateral,
            locked_until,
        };

        return (loan, col);
    }

    // =================================
    // 3) Public: register loan on-chain
    // =================================
    async transition register_loan_public(
        loan_id: u32,
        borrower: address,
        start_block: u32,
        duration_blocks: u32
    ) -> Future {

        // Borrower must be the caller
        assert(borrower == self.caller);

        let b: address = borrower;
        let deadline: u32 = start_block + duration_blocks;

        let f: Future = async {
            // Check if loan already exists
            let exists: bool = loan_active.get_or_use(loan_id, false);
            assert(!exists);

            // Update public mappings
            loan_active.set(loan_id, true);
            loan_owner.set(loan_id, b);
            loan_deadline.set(loan_id, deadline);

            // Keep counter monotonic
            let current: u32 = loan_counter.get_or_use(0u32, 0u32);
            if (loan_id > current) {
                loan_counter.set(0u32, loan_id);
            }
        };

        return f;
    }

    // ==============================================
    // 4) Private: repay loan record (full repayment)
    // ==============================================
    transition repay_private(loan: Loan, payment: u64) -> Loan {
        let borrower: address = self.caller;

        // Validate loan is active
        assert(loan.status == 0u8);
        assert(borrower == loan.owner);

        // Calculate total due (principal + interest)
        let interest_amount: u64 = loan.principal * (loan.interest_bps as u64) / (BASIS_POINTS_DIVISOR as u64);
        let total_due: u64 = loan.principal + interest_amount;
        
        // Require full repayment
        assert(payment >= total_due);

        // Create updated loan record (marked as repaid)
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
            repaid: total_due,
            status: 2u8, // repaid
        };

        return updated;
    }

    // ========================================
    // 5) Public: mark repaid (turn off active)
    // ========================================
    async transition mark_repaid_public(loan_id: u32) -> Future {
        let caller: address = self.caller;

        let f: Future = async {
            // Verify caller is the loan owner
            let owner: address = loan_owner.get(loan_id);
            assert(owner == caller);

            // Mark loan as inactive (repaid)
            loan_active.set(loan_id, false);
        };

        return f;
    }

    // ================================
    // 6) Public: liquidate if expired
    // ================================
    async transition liquidate_public(loan_id: u32) -> Future {
        let caller: address = self.caller;

        let f: Future = async {
            // Check if loan exists and is active
            let is_active: bool = loan_active.get_or_use(loan_id, false);
            assert(is_active);

            // Check if deadline has passed
            let deadline: u32 = loan_deadline.get(loan_id);
            assert(block.height > deadline);

            // Mark loan as inactive (liquidated)
            loan_active.set(loan_id, false);
        };

        return f;
    }

    // ===========================
    // 7) Public: get loan status 
    // ===========================
    async transition get_loan_status(loan_id: u32) -> Future {
        let f: Future = async {
            let is_active: bool = loan_active.get_or_use(loan_id, false);
        };
        return f;
    }

    // ===========================
    // 8) Public: get loan owner 
    // ===========================
    async transition get_loan_owner(loan_id: u32) -> Future {
        let f: Future = async {
            let owner: address = loan_owner.get(loan_id);
        };
        return f;
    }

    // ============================
    // 9) Public: get loan deadline 
    // ============================
    async transition get_loan_deadline(loan_id: u32) -> Future {
        let f: Future = async {
            let deadline: u32 = loan_deadline.get(loan_id);
        };
        return f;
    }

    // ==============================
    // 10) Public: get loan counter 
    // ==============================
    async transition get_loan_counter() -> Future {
        let f: Future = async {
            let counter: u32 = loan_counter.get_or_use(0u32, 0u32);
        };
        return f;
    }
}