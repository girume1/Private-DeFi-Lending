program privlend.aleo;

record CreditTier:
    owner as address.private;
    tier as u8.private;
    nonce as field.private;

record Loan:
    owner as address.private;
    lender as address.private;
    loan_id as u32.private;
    principal as u64.private;
    collateral as u64.private;
    tier as u8.private;
    interest_bps as u16.private;
    start_block as u32.private;
    duration_blocks as u32.private;
    repaid as u64.private;
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

mapping loan_deadline:
    key as u32.public;
    value as u32.public;

function create_credit_tier:
    input r0 as address.private;
    input r1 as u8.private;
    input r2 as field.private;
    lt r1 3u8 into r3;
    assert.eq r3 true;
    cast r0 r1 r2 into r4 as CreditTier.record;
    output r4 as CreditTier.record;

function create_loan_private:
    input r0 as u32.private;
    input r1 as u32.private;
    input r2 as address.private;
    input r3 as CreditTier.record;
    input r4 as u64.private;
    input r5 as u64.private;
    input r6 as u16.private;
    input r7 as u32.private;
    gt r4 0u64 into r8;
    assert.eq r8 true;
    gt r5 0u64 into r9;
    assert.eq r9 true;
    gte r7 1440u32 into r10;
    assert.eq r10 true;
    lte r7 525600u32 into r11;
    assert.eq r11 true;
    lte r6 2000u16 into r12;
    assert.eq r12 true;
    mul r4 150u64 into r13;
    div r13 100u64 into r14;
    gte r5 r14 into r15;
    assert.eq r15 true;
    is.eq r3.owner self.caller into r16;
    assert.eq r16 true;
    lt r3.tier 3u8 into r17;
    assert.eq r17 true;
    add r1 r7 into r18;
    cast self.caller r2 r0 r4 r5 r3.tier r6 r1 r7 0u64 0u8 into r19 as Loan.record;
    cast self.caller r0 r5 r18 into r20 as Collateral.record;
    output r19 as Loan.record;
    output r20 as Collateral.record;

function register_loan_public:
    input r0 as u32.private;
    input r1 as address.private;
    input r2 as u32.private;
    input r3 as u32.private;
    is.eq r1 self.caller into r4;
    assert.eq r4 true;
    add r2 r3 into r5;
    async register_loan_public r0 r1 r5 into r6;
    output r6 as privlend.aleo/register_loan_public.future;

finalize register_loan_public:
    input r0 as u32.public;
    input r1 as address.public;
    input r2 as u32.public;
    get.or_use loan_active[r0] false into r3;
    not r3 into r4;
    assert.eq r4 true;
    set true into loan_active[r0];
    set r1 into loan_owner[r0];
    set r2 into loan_deadline[r0];
    get.or_use loan_counter[0u32] 0u32 into r5;
    gt r0 r5 into r6;
    branch.eq r6 false to end_then_0_0;
    set r0 into loan_counter[0u32];
    branch.eq true true to end_otherwise_0_1;
    position end_then_0_0;
    position end_otherwise_0_1;

function repay_private:
    input r0 as Loan.record;
    input r1 as u64.private;
    is.eq r0.status 0u8 into r2;
    assert.eq r2 true;
    is.eq self.caller r0.owner into r3;
    assert.eq r3 true;
    cast r0.interest_bps into r4 as u64;
    mul r0.principal r4 into r5;
    div r5 10000u64 into r6;
    add r0.principal r6 into r7;
    gte r1 r7 into r8;
    assert.eq r8 true;
    cast r0.owner r0.lender r0.loan_id r0.principal r0.collateral r0.tier r0.interest_bps r0.start_block r0.duration_blocks r7 2u8 into r9 as Loan.record;
    output r9 as Loan.record;

function mark_repaid_public:
    input r0 as u32.private;
    async mark_repaid_public r0 self.caller into r1;
    output r1 as privlend.aleo/mark_repaid_public.future;

finalize mark_repaid_public:
    input r0 as u32.public;
    input r1 as address.public;
    get loan_owner[r0] into r2;
    is.eq r2 r1 into r3;
    assert.eq r3 true;
    set false into loan_active[r0];

function liquidate_public:
    input r0 as u32.private;
    async liquidate_public r0 into r1;
    output r1 as privlend.aleo/liquidate_public.future;

finalize liquidate_public:
    input r0 as u32.public;
    get.or_use loan_active[r0] false into r1;
    assert.eq r1 true;
    get loan_deadline[r0] into r2;
    gt block.height r2 into r3;
    assert.eq r3 true;
    set false into loan_active[r0];

function get_loan_status:
    input r0 as u32.private;
    async get_loan_status r0 into r1;
    output r1 as privlend.aleo/get_loan_status.future;

finalize get_loan_status:
    input r0 as u32.public;
    get.or_use loan_active[r0] false into r1;

function get_loan_owner:
    input r0 as u32.private;
    async get_loan_owner r0 into r1;
    output r1 as privlend.aleo/get_loan_owner.future;

finalize get_loan_owner:
    input r0 as u32.public;
    get loan_owner[r0] into r1;

function get_loan_deadline:
    input r0 as u32.private;
    async get_loan_deadline r0 into r1;
    output r1 as privlend.aleo/get_loan_deadline.future;

finalize get_loan_deadline:
    input r0 as u32.public;
    get loan_deadline[r0] into r1;

function get_loan_counter:
    async get_loan_counter into r0;
    output r0 as privlend.aleo/get_loan_counter.future;

finalize get_loan_counter:
    get.or_use loan_counter[0u32] 0u32 into r0;

constructor:
    assert.eq edition 0u16;
