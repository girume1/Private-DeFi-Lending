import credits.aleo;
import test_usdcx_stablecoin.aleo;

program privlend_v6.aleo {

    @noupgrade
    constructor() {}

    // =========================
    //         Constants
    // =========================
    const MIN_DURATION:           u32  = 1440u32;
    const MAX_DURATION:           u32  = 525600u32;
    const MAX_INTEREST_BPS:       u16  = 2000u16;
    const BASIS_POINTS_DIVISOR:   u128 = 10000u128;
    const MIN_COLLATERAL_RATIO:   u64  = 150u64;  // tier 0 default
    const TIER_1_COLLATERAL_RATIO: u64 = 135u64;  // tier 1: 135%
    const TIER_2_COLLATERAL_RATIO: u64 = 120u64;  // tier 2: 120%
    const SWAP_RATE:              u128 = 1u128;
    const TIER_1_MIN_REPAYMENTS:  u32  = 1u32;
    const TIER_2_MIN_REPAYMENTS:  u32  = 3u32;

    // =========================
    //  Public on-chain mappings
    // =========================
    mapping loan_counter:      u32     => u32;
    mapping loan_active:       u32     => bool;
    mapping loan_owner:        u32     => address;
    mapping loan_lender:       u32     => address;
    mapping loan_deadline:     u32     => u32;
    mapping collateral_locked: u32     => bool;
    mapping repayment_count:   address => u32;
    mapping loan_principal:    u32     => u128;

    // =========================
    //       Private records
    // =========================
    record CreditTier {
        owner: address,
        tier:  u8,
        nonce: field,
    }

    record Loan {
        owner:           address,
        lender:          address,
        loan_id:         u32,
        principal:       u128,
        collateral:      u64,
        tier:            u8,
        interest_bps:    u16,
        start_block:     u32,
        duration_blocks: u32,
        repaid:          u128,
        status:          u8,
    }

    record Collateral {
        owner:        address,
        loan_id:      u32,
        amount:       u64,
        locked_until: u32,
    }

    // ----------------------------------------------------------------
    // 1) Issue credit tier  (plain fn — record output, no on-chain state)
    // ----------------------------------------------------------------
    fn create_credit_tier(receiver: address, tier: u8, nonce: field) -> CreditTier {
        assert_eq(self.caller, receiver);
        assert(tier < 3u8);
        return CreditTier { owner: receiver, tier, nonce };
    }

    // ----------------------------------------------------------------
    // 2) Open loan
    // ----------------------------------------------------------------
    fn open_loan(
        loan_id:         u32,
        start_block:     u32,
        lender:          address,
        credit:          CreditTier,
        principal:       u128,
        collateral:      u64,
        interest_bps:    u16,
        duration_blocks: u32
    ) -> (Loan, Collateral, Final) {
        let borrower: address = self.caller;

        assert(principal       > 0u128);
        assert(collateral      > 0u64);
        assert(duration_blocks >= MIN_DURATION);
        assert(duration_blocks <= MAX_DURATION);
        assert(interest_bps    <= MAX_INTEREST_BPS);
        assert(credit.owner    == borrower);
        assert(credit.tier     < 3u8);

        // Tier-based collateral ratio: tier 0 = 150%, tier 1 = 135%, tier 2 = 120%
        let ratio: u64 = credit.tier == 1u8 ? TIER_1_COLLATERAL_RATIO : (credit.tier == 2u8 ? TIER_2_COLLATERAL_RATIO : MIN_COLLATERAL_RATIO);
        let required: u64 = (principal as u64) * ratio / 100u64;
        assert(collateral >= required);

        let locked_until: u32 = start_block + duration_blocks;
        let tier_used: u8     = credit.tier;

        // Lock collateral: transfer from signer to this program
        let ft_col: Final = credits.aleo::transfer_public_as_signer(self.address, collateral);

        let loan: Loan = Loan {
            owner:           borrower,
            lender,
            loan_id,
            principal,
            collateral,
            tier:            tier_used,
            interest_bps,
            start_block,
            duration_blocks,
            repaid:          0u128,
            status:          0u8,
        };

        let col: Collateral = Collateral {
            owner:        borrower,
            loan_id,
            amount:       collateral,
            locked_until,
        };

        return (loan, col, final {
            ft_col.run();

            let exists: bool = loan_active.get_or_use(loan_id, false);
            assert(!exists);

            // Enforce credit tier repayment history
            let count: u32 = repayment_count.get_or_use(borrower, 0u32);
            let min_repayments: u32 = tier_used == 1u8 ? TIER_1_MIN_REPAYMENTS : (tier_used == 2u8 ? TIER_2_MIN_REPAYMENTS : 0u32);
            assert(count >= min_repayments);

            loan_active.set(loan_id,       true);
            loan_owner.set(loan_id,        borrower);
            loan_lender.set(loan_id,       lender);
            loan_deadline.set(loan_id,     locked_until);
            collateral_locked.set(loan_id, true);
            loan_principal.set(loan_id,    principal);

            let current: u32 = loan_counter.get_or_use(0u32, 0u32);
            loan_counter.set(0u32, current + 1u32);
        });
    }

    // ----------------------------------------------------------------
    // 3) Fund borrower
    // ----------------------------------------------------------------
    fn fund_borrower(loan_id: u32, borrower: address, amount: u128) -> Final {
        let lender: address = self.caller;

        let ft_fund: Final = test_usdcx_stablecoin.aleo::transfer_public_as_signer(borrower, amount);

        return final {
            ft_fund.run();

            let registered_lender: address = loan_lender.get(loan_id);
            assert(registered_lender == lender);

            let is_active: bool = loan_active.get_or_use(loan_id, false);
            assert(is_active);

            let agreed: u128 = loan_principal.get(loan_id);
            assert(amount == agreed);
        };
    }

    // ----------------------------------------------------------------
    // 4) Repay loan
    // ----------------------------------------------------------------
    fn repay_loan(loan: Loan, payment: u128, current_block: u32) -> (Loan, Final) {
        let borrower: address  = self.caller;
        let lender: address    = loan.lender;
        let loan_id: u32       = loan.loan_id;
        let collateral: u64    = loan.collateral;

        assert(loan.status == 0u8);
        assert(borrower    == loan.owner);

        // Time-based interest: proportional to elapsed blocks
        let elapsed: u32          = current_block - loan.start_block;
        let interest_amount: u128 = loan.principal * (loan.interest_bps as u128)
                                    * (elapsed as u128)
                                    / (BASIS_POINTS_DIVISOR * (loan.duration_blocks as u128));
        let total_due: u128 = loan.principal + interest_amount;

        // Partial payment support
        assert(payment > 0u128);
        assert(loan.repaid + payment <= total_due);

        let new_repaid: u128      = loan.repaid + payment;
        let is_fully_repaid: bool = new_repaid >= total_due;
        let new_status: u8        = is_fully_repaid ? 2u8 : 0u8;
        let release_amount: u64   = is_fully_repaid ? collateral : 0u64;

        // Transfer payment to lender
        let ft_repay: Final   = test_usdcx_stablecoin.aleo::transfer_public_as_signer(lender, payment);
        // Release collateral to borrower (0 if partial payment)
        let ft_release: Final = credits.aleo::transfer_public(borrower, release_amount);

        let updated: Loan = Loan {
            owner:           loan.owner,
            lender:          loan.lender,
            loan_id:         loan.loan_id,
            principal:       loan.principal,
            collateral:      loan.collateral,
            tier:            loan.tier,
            interest_bps:    loan.interest_bps,
            start_block:     loan.start_block,
            duration_blocks: loan.duration_blocks,
            repaid:          new_repaid,
            status:          new_status,
        };

        return (updated, final {
            ft_repay.run();
            ft_release.run();

            let owner: address = loan_owner.get(loan_id);
            assert(owner == borrower);

            let new_active: bool = !is_fully_repaid;
            let new_locked: bool = !is_fully_repaid;
            loan_active.set(loan_id,       new_active);
            collateral_locked.set(loan_id, new_locked);

            let prev_count: u32 = repayment_count.get_or_use(borrower, 0u32);
            let increment: u32  = is_fully_repaid ? 1u32 : 0u32;
            repayment_count.set(borrower, prev_count + increment);
        });
    }

    // ----------------------------------------------------------------
    // 5) Liquidate
    // ----------------------------------------------------------------
    fn liquidate(loan_id: u32, col_amount: u64) -> Final {
        let caller: address = self.caller;

        let ft_liq: Final = credits.aleo::transfer_public(caller, col_amount);

        return final {
            let is_active: bool = loan_active.get_or_use(loan_id, false);
            assert(is_active);

            let deadline: u32 = loan_deadline.get(loan_id);
            assert(block.height >= deadline);

            let lender: address = loan_lender.get(loan_id);
            assert(caller == lender);

            let locked: bool = collateral_locked.get_or_use(loan_id, false);
            assert(locked);

            ft_liq.run();

            loan_active.set(loan_id,       false);
            collateral_locked.set(loan_id, false);
        };
    }

    // ----------------------------------------------------------------
    // 6) Release collateral (borrower-initiated after full repayment)
    // ----------------------------------------------------------------
    fn release_collateral(col_loan_id: u32, col_amount: u64) -> Final {
        let caller: address = self.caller;

        let ft_release: Final = credits.aleo::transfer_public(caller, col_amount);

        return final {
            let is_active: bool = loan_active.get_or_use(col_loan_id, false);
            assert(!is_active);

            let owner: address = loan_owner.get(col_loan_id);
            assert(caller == owner);

            ft_release.run();

            collateral_locked.set(col_loan_id, false);
        };
    }

    // ----------------------------------------------------------------
    // 7) Swap credits → USDCx
    // ----------------------------------------------------------------
    fn swap_credits_for_usdcx(amount_in: u64, min_out: u128) -> Final {
        let swapper: address = self.caller;

        assert(amount_in > 0u64);

        let amount_out: u128 = (amount_in as u128) * SWAP_RATE;
        assert(amount_out >= min_out);

        let ft_in:  Final = credits.aleo::transfer_public_as_signer(self.address, amount_in);
        let ft_out: Final = test_usdcx_stablecoin.aleo::transfer_public(swapper, amount_out);

        return final {
            ft_in.run();
            ft_out.run();
        };
    }

    // ----------------------------------------------------------------
    // 8) Swap USDCx → credits
    // ----------------------------------------------------------------
    fn swap_usdcx_for_credits(amount_in: u128, min_out: u64) -> Final {
        let swapper: address = self.caller;

        assert(amount_in > 0u128);

        let amount_out: u64 = (amount_in as u64) / (SWAP_RATE as u64);
        assert(amount_out >= min_out);

        let ft_in:  Final = test_usdcx_stablecoin.aleo::transfer_public_as_signer(self.address, amount_in);
        let ft_out: Final = credits.aleo::transfer_public(swapper, amount_out);

        return final {
            ft_in.run();
            ft_out.run();
        };
    }
}
