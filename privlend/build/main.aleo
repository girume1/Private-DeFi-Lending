import credits.aleo;
import merkle_tree.aleo;
import test_usdcx_multisig_core.aleo;
import test_usdcx_freezelist.aleo;
import test_usdcx_stablecoin.aleo;
program privlend_v8.aleo;

record CreditTier:
    owner as address.private;
    tier as u8.private;
    nonce as field.private;

record Loan:
    owner as address.private;
    lender as address.private;
    loan_id as u32.private;
    principal as u128.private;
    collateral as u64.private;
    tier as u8.private;
    interest_bps as u16.private;
    start_block as u32.private;
    duration_blocks as u32.private;
    repaid as u128.private;
    status as u8.private;

record Collateral:
    owner as address.private;
    loan_id as u32.private;
    amount as u64.private;
    locked_until as u32.private;

mapping loan_counter:
    key as u32.public;
    value as u32.public;

mapping loan_active:
    key as u32.public;
    value as boolean.public;

mapping loan_owner:
    key as u32.public;
    value as address.public;

mapping loan_lender:
    key as u32.public;
    value as address.public;

mapping loan_deadline:
    key as u32.public;
    value as u32.public;

mapping collateral_locked:
    key as u32.public;
    value as boolean.public;

mapping repayment_count:
    key as address.public;
    value as u32.public;

mapping loan_principal:
    key as u32.public;
    value as u128.public;

mapping loan_collateral:
    key as u32.public;
    value as u64.public;

function create_credit_tier:
    input r0 as address.private;
    input r1 as u8.private;
    input r2 as field.private;
    assert.eq self.caller r0;
    lt r1 3u8 into r3;
    assert.eq r3 true;
    cast r0 r1 r2 into r4 as CreditTier.record;
    output r4 as CreditTier.record;

function open_loan:
    input r0 as u32.private;
    input r1 as u32.private;
    input r2 as address.private;
    input r3 as CreditTier.record;
    input r4 as u128.private;
    input r5 as u64.private;
    input r6 as u16.private;
    input r7 as u32.private;
    gt r4 0u128 into r8;
    assert.eq r8 true;
    gt r5 0u64 into r9;
    assert.eq r9 true;
    gte r7 1440u32 into r10;
    assert.eq r10 true;
    lte r7 525600u32 into r11;
    assert.eq r11 true;
    lte r6 2000u16 into r12;
    assert.eq r12 true;
    is.eq r3.owner self.caller into r13;
    assert.eq r13 true;
    lt r3.tier 3u8 into r14;
    assert.eq r14 true;
    is.eq r3.tier 1u8 into r15;
    is.eq r3.tier 2u8 into r16;
    ternary r16 120u64 150u64 into r17;
    ternary r15 135u64 r17 into r18;
    cast r4 into r19 as u64;
    mul r19 r18 into r20;
    div r20 100u64 into r21;
    gte r5 r21 into r22;
    assert.eq r22 true;
    add r1 r7 into r23;
    call credits.aleo/transfer_public_as_signer privlend_v8.aleo r5 into r24;
    cast self.caller r2 r0 r4 r5 r3.tier r6 r1 r7 0u128 0u8 into r25 as Loan.record;
    cast self.caller r0 r5 r23 into r26 as Collateral.record;
    async open_loan r24 r0 self.caller r3.tier r2 r23 r4 r5 into r27;
    output r25 as Loan.record;
    output r26 as Collateral.record;
    output r27 as privlend_v8.aleo/open_loan.future;

finalize open_loan:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as u32.public;
    input r2 as address.public;
    input r3 as u8.public;
    input r4 as address.public;
    input r5 as u32.public;
    input r6 as u128.public;
    input r7 as u64.public;
    await r0;
    get.or_use loan_active[r1] false into r8;
    not r8 into r9;
    assert.eq r9 true;
    get.or_use repayment_count[r2] 0u32 into r10;
    is.eq r3 1u8 into r11;
    is.eq r3 2u8 into r12;
    ternary r12 3u32 0u32 into r13;
    ternary r11 1u32 r13 into r14;
    gte r10 r14 into r15;
    assert.eq r15 true;
    set true into loan_active[r1];
    set r2 into loan_owner[r1];
    set r4 into loan_lender[r1];
    set r5 into loan_deadline[r1];
    set true into collateral_locked[r1];
    set r6 into loan_principal[r1];
    set r7 into loan_collateral[r1];
    get.or_use loan_counter[0u32] 0u32 into r16;
    add r16 1u32 into r17;
    set r17 into loan_counter[0u32];

function fund_borrower:
    input r0 as u32.private;
    input r1 as address.private;
    input r2 as u128.private;
    call test_usdcx_stablecoin.aleo/transfer_public_as_signer r1 r2 into r3;
    async fund_borrower r3 r0 self.caller r2 into r4;
    output r4 as privlend_v8.aleo/fund_borrower.future;

finalize fund_borrower:
    input r0 as test_usdcx_stablecoin.aleo/transfer_public_as_signer.future;
    input r1 as u32.public;
    input r2 as address.public;
    input r3 as u128.public;
    await r0;
    get loan_lender[r1] into r4;
    is.eq r4 r2 into r5;
    assert.eq r5 true;
    get.or_use loan_active[r1] false into r6;
    assert.eq r6 true;
    get loan_principal[r1] into r7;
    is.eq r3 r7 into r8;
    assert.eq r8 true;

function repay_partial:
    input r0 as Loan.record;
    input r1 as u128.private;
    input r2 as u32.private;
    is.eq r0.status 0u8 into r3;
    assert.eq r3 true;
    is.eq self.caller r0.owner into r4;
    assert.eq r4 true;
    gt r1 0u128 into r5;
    assert.eq r5 true;
    sub r2 r0.start_block into r6;
    cast r0.interest_bps into r7 as u128;
    mul r0.principal r7 into r8;
    cast r6 into r9 as u128;
    mul r8 r9 into r10;
    cast r0.duration_blocks into r11 as u128;
    mul 10000u128 r11 into r12;
    div r10 r12 into r13;
    add r0.principal r13 into r14;
    add r0.repaid r1 into r15;
    lt r15 r14 into r16;
    assert.eq r16 true;
    call test_usdcx_stablecoin.aleo/transfer_public_as_signer r0.lender r1 into r17;
    add r0.repaid r1 into r18;
    cast r0.owner r0.lender r0.loan_id r0.principal r0.collateral r0.tier r0.interest_bps r0.start_block r0.duration_blocks r18 0u8 into r19 as Loan.record;
    async repay_partial r17 r0.loan_id self.caller into r20;
    output r19 as Loan.record;
    output r20 as privlend_v8.aleo/repay_partial.future;

finalize repay_partial:
    input r0 as test_usdcx_stablecoin.aleo/transfer_public_as_signer.future;
    input r1 as u32.public;
    input r2 as address.public;
    await r0;
    get loan_owner[r1] into r3;
    is.eq r3 r2 into r4;
    assert.eq r4 true;

function repay_full:
    input r0 as Loan.record;
    input r1 as u128.private;
    input r2 as u32.private;
    is.eq r0.status 0u8 into r3;
    assert.eq r3 true;
    is.eq self.caller r0.owner into r4;
    assert.eq r4 true;
    gt r1 0u128 into r5;
    assert.eq r5 true;
    sub r2 r0.start_block into r6;
    cast r0.interest_bps into r7 as u128;
    mul r0.principal r7 into r8;
    cast r6 into r9 as u128;
    mul r8 r9 into r10;
    cast r0.duration_blocks into r11 as u128;
    mul 10000u128 r11 into r12;
    div r10 r12 into r13;
    add r0.principal r13 into r14;
    add r0.repaid r1 into r15;
    gte r15 r14 into r16;
    assert.eq r16 true;
    call test_usdcx_stablecoin.aleo/transfer_public_as_signer r0.lender r1 into r17;
    call credits.aleo/transfer_public self.caller r0.collateral into r18;
    cast r0.owner r0.lender r0.loan_id r0.principal r0.collateral r0.tier r0.interest_bps r0.start_block r0.duration_blocks r14 2u8 into r19 as Loan.record;
    async repay_full r17 r18 r0.loan_id self.caller into r20;
    output r19 as Loan.record;
    output r20 as privlend_v8.aleo/repay_full.future;

finalize repay_full:
    input r0 as test_usdcx_stablecoin.aleo/transfer_public_as_signer.future;
    input r1 as credits.aleo/transfer_public.future;
    input r2 as u32.public;
    input r3 as address.public;
    await r0;
    await r1;
    get loan_owner[r2] into r4;
    is.eq r4 r3 into r5;
    assert.eq r5 true;
    set false into loan_active[r2];
    set false into collateral_locked[r2];
    set 0u64 into loan_collateral[r2];
    get.or_use repayment_count[r3] 0u32 into r6;
    add r6 1u32 into r7;
    set r7 into repayment_count[r3];

function liquidate:
    input r0 as u32.private;
    input r1 as u64.private;
    call credits.aleo/transfer_public self.caller r1 into r2;
    async liquidate r0 self.caller r1 r2 into r3;
    output r3 as privlend_v8.aleo/liquidate.future;

finalize liquidate:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u64.public;
    input r3 as credits.aleo/transfer_public.future;
    get.or_use loan_active[r0] false into r4;
    assert.eq r4 true;
    get loan_deadline[r0] into r5;
    gte block.height r5 into r6;
    assert.eq r6 true;
    get loan_lender[r0] into r7;
    is.eq r1 r7 into r8;
    assert.eq r8 true;
    get.or_use collateral_locked[r0] false into r9;
    assert.eq r9 true;
    get loan_collateral[r0] into r10;
    is.eq r2 r10 into r11;
    assert.eq r11 true;
    await r3;
    set false into loan_active[r0];
    set false into collateral_locked[r0];
    set 0u64 into loan_collateral[r0];

function release_collateral:
    input r0 as u32.private;
    input r1 as u64.private;
    call credits.aleo/transfer_public self.caller r1 into r2;
    async release_collateral r0 self.caller r2 into r3;
    output r3 as privlend_v8.aleo/release_collateral.future;

finalize release_collateral:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as credits.aleo/transfer_public.future;
    get.or_use loan_active[r0] false into r3;
    not r3 into r4;
    assert.eq r4 true;
    get loan_owner[r0] into r5;
    is.eq r1 r5 into r6;
    assert.eq r6 true;
    await r2;
    set false into collateral_locked[r0];

function swap_credits_for_usdcx:
    input r0 as u64.private;
    input r1 as u128.private;
    gt r0 0u64 into r2;
    assert.eq r2 true;
    cast r0 into r3 as u128;
    mul r3 1u128 into r4;
    gte r4 r1 into r5;
    assert.eq r5 true;
    call credits.aleo/transfer_public_as_signer privlend_v8.aleo r0 into r6;
    call test_usdcx_stablecoin.aleo/transfer_public self.caller r4 into r7;
    async swap_credits_for_usdcx r6 r7 into r8;
    output r8 as privlend_v8.aleo/swap_credits_for_usdcx.future;

finalize swap_credits_for_usdcx:
    input r0 as credits.aleo/transfer_public_as_signer.future;
    input r1 as test_usdcx_stablecoin.aleo/transfer_public.future;
    await r0;
    await r1;

function swap_usdcx_for_credits:
    input r0 as u128.private;
    input r1 as u64.private;
    gt r0 0u128 into r2;
    assert.eq r2 true;
    cast r0 into r3 as u64;
    div r3 1u64 into r4;
    gte r4 r1 into r5;
    assert.eq r5 true;
    call test_usdcx_stablecoin.aleo/transfer_public_as_signer privlend_v8.aleo r0 into r6;
    call credits.aleo/transfer_public self.caller r4 into r7;
    async swap_usdcx_for_credits r6 r7 into r8;
    output r8 as privlend_v8.aleo/swap_usdcx_for_credits.future;

finalize swap_usdcx_for_credits:
    input r0 as test_usdcx_stablecoin.aleo/transfer_public_as_signer.future;
    input r1 as credits.aleo/transfer_public.future;
    await r0;
    await r1;

constructor:
    assert.eq edition 0u16;
