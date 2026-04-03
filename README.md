<p align="center">
  <img src="https://i.ibb.co/kTMVCmm/Private.jpg" width="60%" />
</p>

<h1 align="center">🔐 PrivLend v5 — Private DeFi Lending on Aleo</h1>
<p align="center"><em>Zero-Knowledge Lending with On-Chain Credit Enforcement</em></p>

<p align="center">
  <a href="https://privlend.vercel.app"><img src="https://img.shields.io/badge/🌐_Live_App-privlend.vercel.app-F59E0B?style=for-the-badge" /></a>
  <a href="https://testnet.explorer.provable.com/transaction/at12908pdlaquufhnp8e4crj0paym07rlucz5vvthwlh3f5gr9k4cgs4t992v"><img src="https://img.shields.io/badge/🔍_Deployed-v5_on_Testnet-8B5CF6?style=for-the-badge" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge" /></a>
</p>

<p align="center">
    <a href="https://aleo.org">
    <img src="https://img.shields.io/badge/Network-Aleo_Testnet-purple" />
    </a>
    <a href="https://testnet.explorer.provable.com/program/privlend_v5.aleo">
    <img src="https://img.shields.io/badge/Contract-privlend__v5.aleo-F59E0B" />
    </a>  
    <a href="https://docs.leo-lang.org/leo">
    <img src="https://img.shields.io/badge/Language-Leo_4.0-blue" />
     </a>
    <a href="https://react.dev">
    <img src="https://img.shields.io/badge/Frontend-React_+_Vite-61dafb" />
     </a>
     <a href="https://developer.aleo.org">
    <img src="https://img.shields.io/badge/ZK-Zero_Knowledge-green" />
     </a>
</p>

---

## The Problem

Every DeFi lending protocol today is an open book. Your wallet balance, loan size, collateral ratio, interest rate — all of it visible to anyone with a block explorer. This is surveillance infrastructure dressed up as financial infrastructure.

**PrivLend proves you don't have to choose between decentralization and privacy.**

---

## What PrivLend v5 Does

PrivLend is a fully on-chain, privacy-preserving lending protocol on **Aleo**. Borrowers prove creditworthiness with a **Zero-Knowledge CreditTier record** — lenders see the tier (0, 1, or 2), never the identity behind it. Every sensitive loan detail is stored as an **encrypted private record** inside the borrower's wallet. The chain only ever learns the minimum it needs to enforce the rules.

```
Traditional DeFi:  "Here is my address, my balance, my loan, my collateral."
PrivLend v5:       "I am creditworthy. Here is the ZK proof."
```

### What's New in v5

v5 addresses four critical protocol issues identified by Wave 4 judges:

1. **On-Chain Credit Tier Enforcement** — Tier 1 requires ≥1 successful repayment, Tier 2 requires ≥3. Enforced via the `repayment_count` mapping. No more self-asserted tiers.

2. **Fund Amount Verification** — `fund_borrower` now asserts `amount == loan_principal.get(loan_id)`. Under/over-funding is rejected on-chain.

3. **Collateral Privacy Fix** — `collateral_locked` changed from `u64` → `bool`. Observers can no longer infer the private principal from the public collateral amount.

4. **Time-Based Interest + Partial Repayments** — Interest accrues proportionally to elapsed blocks: `interest = principal × bps × elapsed / (10000 × duration)`. Partial payments are accepted; the loan stays active until fully cleared.

---

## Privacy Guarantees

| Data | Visibility (v5) |
|---|---|
| Principal amount | 🔒 Private — encrypted in borrower's wallet |
| Collateral value | 🔒 Private — encrypted in borrower's wallet |
| Interest rate | 🔒 Private — encrypted in borrower's wallet |
| Repayment amount | 🔒 Private — encrypted in borrower's wallet |
| Credit tier | 🔒 Private — ZK record, never revealed on-chain |
| Loan ID | 🌐 Public |
| Borrower address | 🌐 Public |
| Lender address | 🌐 Public |
| Active status | 🌐 Public |
| Deadline block | 🌐 Public |
| **Collateral locked** | 🌐 **Public (bool only)** — v5 stores true/false, not the raw amount |
| **Repayment count** | 🌐 **Public (u32)** — v5 tracks successful repayments for tier enforcement |

> v5 minimizes information leakage: the public chain sees only boolean flags and counters, never sensitive amounts.

---

## Live Deployment

| | |
|---|---|
| **Frontend** | https://privlend.vercel.app |
| **Program ID** | `privlend_v5.aleo` |
| **Network** | Aleo Testnet |
| **Deployment TX** | `at12908pdlaquufhnp8e4crj0paym07rlucz5vvthwlh3f5gr9k4cgs4t992v` |
| **Explorer** | https://testnet.explorer.provable.com/program/privlend_v5.aleo |

---

## Project Structure

```
privlend/
├── frontend/
│   └── src/
│       ├── components/     # LoanCard, CreditTierCreator, LoanCreationForm, Swap
│       ├── context/        # PrivLendContext — global state & wallet integration
│       ├── pages/          # Dashboard, Borrow, Markets, Portfolio, Swap, Landing
│       ├── services/       # TransactionManager — public tx history via Provable API
│       ├── types/          # TypeScript types mirroring Leo records
│       └── utils/          # AleoService — public mapping reads via REST API
├── src/
│   └── main.leo            # privlend_v5.aleo — Leo 4.0 smart contract
├── tests/
│   ├── bug_condition_exploration.ts   # Property-based tests for bug conditions
│   └── preservation_properties.ts     # Regression tests for unchanged behaviors
└── program.json            # Leo 4.0 manifest
```

---

## Architecture

```
┌─────────────────────────────────────────┐
│         React + Vite Frontend           │
│    (MUI, Framer Motion, TypeScript)     │
└──────────────────┬──────────────────────┘
                   │  wallet adapter
┌──────────────────▼──────────────────────┐
│      Shield / Leo / Puzzle Wallet       │
│   (record decryption, ZK proof gen)     │
└──────────────────┬──────────────────────┘
                   │  executeTransaction
┌──────────────────▼──────────────────────┐
│         privlend_v5.aleo                │
│      (Leo 4.0 Smart Contract)           │
└───────────────┬──────────┬─────────────┘
                │          │
   ┌────────────▼──┐  ┌────▼──────────────────┐
   │ Private Records│  │  Public Mappings (v5) │
   │ (encrypted,    │  │  loan_active          │
   │  wallet-only)  │  │  loan_owner           │
   │                │  │  loan_lender          │
   │  Loan          │  │  loan_deadline        │
   │  Collateral    │  │  collateral_locked    │
   │  CreditTier    │  │  loan_principal  (v5) │
   │                │  │  repayment_count (v5) │
   │                │  │  loan_counter         │
   └────────────────┘  └───────────────────────┘
```

---

## Smart Contract Reference

**Program:** `privlend_v5.aleo` (Leo 4.0)

### Constants (enforced on-chain)

| Constant | Value | Meaning |
|---|---|---|
| `MIN_COLLATERAL_RATIO` | 150% | All loans require collateral ≥ 1.5× principal |
| `MAX_INTEREST_BPS` | 2000 bps | Maximum interest rate: 20% |
| `MIN_DURATION` | 1,440 blocks | ~1 day minimum loan duration |
| `MAX_DURATION` | 525,600 blocks | ~1 year maximum loan duration |
| `SWAP_RATE` | 1:1 | Microcredits ↔ USDCx (testnet) |
| `TIER_1_MIN_REPAYMENTS` | 1 | Tier 1 requires ≥1 successful repayment (v5) |
| `TIER_2_MIN_REPAYMENTS` | 3 | Tier 2 requires ≥3 successful repayments (v5) |

### Functions (Leo 4.0)

| Function | Returns | Description |
|---|---|---|
| `create_credit_tier(receiver, tier, nonce)` | `CreditTier` | Issues a private ZK CreditTier record. Tier must be 0, 1, or 2. |
| `open_loan(loan_id, start_block, lender, credit, principal, collateral, interest_bps, duration_blocks)` | `(Loan, Collateral, Final)` | Locks collateral, validates tier eligibility via `repayment_count`, creates private records, writes public mappings. |
| `fund_borrower(loan_id, borrower, amount)` | `Final` | Lender sends USDCx. v5 verifies `amount == loan_principal.get(loan_id)`. |
| `repay_loan(loan, payment, current_block)` | `(Loan, Final)` | Time-based interest. Accepts partial payments. Increments `repayment_count` on full repayment. |
| `liquidate(loan_id, col_amount)` | `Final` | Lender claims collateral after deadline. v5 checks `collateral_locked` as bool. |
| `release_collateral(col_loan_id, col_amount)` | `Final` | Borrower-initiated collateral release after full repayment (v5). |
| `swap_credits_for_usdcx(amount_in, min_out)` | `Final` | Swap ALEO → USDCx at 1:1 testnet rate. |
| `swap_usdcx_for_credits(amount_in, min_out)` | `Final` | Swap USDCx → ALEO at 1:1 testnet rate. |

### Private Records

```leo
record Loan {
    owner:           address,   // borrower
    lender:          address,
    loan_id:         u32,
    principal:       u128,      // USDCx amount
    collateral:      u64,       // microcredits
    tier:            u8,        // 0, 1, or 2
    interest_bps:    u16,       // e.g. 500 = 5%
    start_block:     u32,
    duration_blocks: u32,
    repaid:          u128,      // v5: tracks partial payments
    status:          u8,        // 0=active, 2=repaid
}

record CreditTier {
    owner: address,
    tier:  u8,       // 0=anyone, 1=≥1 repayment, 2=≥3 repayments (v5)
    nonce: field,
}

record Collateral {
    owner:        address,
    loan_id:      u32,
    amount:       u64,
    locked_until: u32,
}
```

### Public Mappings (v5)

| Mapping | Type | Purpose |
|---|---|---|
| `loan_active` | `u32 → bool` | Whether a loan is currently open |
| `loan_owner` | `u32 → address` | Borrower address per loan |
| `loan_lender` | `u32 → address` | Lender address per loan |
| `loan_deadline` | `u32 → u32` | Expiry block height |
| `collateral_locked` | `u32 → bool` | **v5: bool only** — no amount leaked |
| `loan_principal` | `u32 → u128` | **v5: new** — agreed principal for fund verification |
| `repayment_count` | `address → u32` | **v5: new** — on-chain repayment history for tier enforcement |
| `loan_counter` | `u32 → u32` | Total loans ever created |

---

## Loan Lifecycle (v5)

```
Borrower                          Lender
   │                                │
   ├─── create_credit_tier ─────────┤  (ZK record minted, tier hidden)
   │                                │
   ├─── open_loan ──────────────────┤  (collateral locked, tier verified on-chain)
   │                                │
   │◄─── fund_borrower ─────────────┤  (lender sends exact USDCx principal — verified)
   │                                │
   ├─── repay_loan ─────────────────►  (partial or full payment, time-based interest)
   │    (can repeat)                │
   │                                │
   ├─── repay_loan (final) ─────────►  (collateral released, repayment_count++)
   │                                │
   │         OR (if expired)        │
   │                                │
   │◄─────── liquidate ─────────────┤  (lender claims locked collateral)
```

---

## Getting Started

### Requirements

- Node.js ≥ 18
- pnpm (or npm/yarn)
- [Shield Wallet](https://chromewebstore.google.com/detail/shield/hhddpjpacfjaakjioinajgmhlbhfchao) browser extension (recommended) or Leo Wallet
- Leo 4.0 (for local development)

### 1. Clone & Install

```bash
git clone https://github.com/girume1/Private-DeFi-Lending
cd Private-DeFi-Lending
cd frontend
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

`.env` contents:

```env
VITE_PROGRAM_ID=privlend_v5.aleo
VITE_NETWORK=testnet
VITE_API_ENDPOINT=https://api.explorer.provable.com/v2
VITE_USDCX_PROGRAM=test_usdcx_stablecoin.aleo
VITE_CREDITS_PROGRAM=credits.aleo
```

### 3. Run

```bash
pnpm dev
# → http://localhost:5173
```

---

## Testing the Full Flow (v5)

> You'll need two browser profiles or wallets — one for the borrower, one for the lender.

**As Borrower:**

1. Connect Shield Wallet at https://privlend.vercel.app
2. Get test ALEO from https://faucet.aleo.org
3. Go to **Swap** → swap some ALEO → USDCx (needed for repayment later)
4. Go to **Borrow** → click **Create Credit Tier** → pick tier 0 (tier 1/2 require repayment history)
5. Click **New Loan** → set principal, collateral (≥ 150%), interest rate, duration, lender address
6. Share the loan ID with your lender

**As Lender:**

7. Connect a second wallet on **Markets** page
8. Find the loan by ID → click **Fund Borrower** → send the exact USDCx principal (v5 verifies on-chain)

**Back as Borrower:**

9. Go to **Portfolio** → click **Repay** → enter payment amount (partial ok in v5)
10. If partial: loan stays active, `repaid` field updates
11. If full: collateral releases automatically, `repayment_count` increments (unlocks tier upgrades)

---

## Credit Tiers (v5)

Credit tiers are **ZK records with on-chain enforcement**. v5 checks `repayment_count` before issuing tier upgrades.

| Tier | Eligibility (v5) | Suggested Interest Range |
|---|---|---|
| `0` — Tier A | Anyone (no history required) | 2–5% |
| `1` — Tier B | ≥1 successful repayment | 5–10% |
| `2` — Tier C | ≥3 successful repayments | 10–20% |

> **v5 Change:** The `open_loan` finalize block reads `repayment_count.get_or_use(borrower, 0u32)` and asserts `count >= required_repayments(tier)`. Tier upgrades are now earned, not self-asserted.

---

## Why Aleo?

Other ZK chains let you *hide* a transaction. Aleo lets you *prove properties* about a transaction without revealing the transaction itself.

PrivLend v5 uses this in a specific way:

- The `CreditTier` record proves "this person has earned tier 1" without revealing *who* they are or *what loans they've repaid*
- The `Loan` record stores all sensitive terms in the borrower's wallet — the on-chain contract enforces time-based interest arithmetic without ever seeing the plaintext
- The `repay_loan` function verifies `payment > 0 && repaid + payment <= total_due` **inside the ZK circuit** — partial payments work without exposing balances

> **DeFi can be transparent in logic, private in data. PrivLend v5 is the proof.**

---

## v4 → v5 Migration Summary

| Issue | v4 Behavior | v5 Fix |
|---|---|---|
| **Unenforced Credit Tiers** | `create_credit_tier` issues any tier with no history check | `open_loan` checks `repayment_count >= required_repayments(tier)` |
| **Fund Amount Mismatch** | `fund_borrower` accepts any amount | Asserts `amount == loan_principal.get(loan_id)` |
| **Collateral Privacy Leak** | `collateral_locked: u32 → u64` stores exact amount | `collateral_locked: u32 → bool` stores true/false only |
| **Flat Interest** | `interest = principal × bps / 10000` (time-blind) | `interest = principal × bps × elapsed / (10000 × duration)` |
| **No Partial Repayment** | `assert(payment == total_due)` rejects partials | `assert(payment > 0 && repaid + payment <= total_due)` accepts partials |

---

## Built With

| | |
|---|---|
| [Leo 4.0](https://docs.leo-lang.org/leo) | Aleo's ZK smart contract language |
| [React](https://react.dev) + [Vite](https://vitejs.dev) | Frontend framework |
| [Material UI](https://mui.com) | Component library |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [@provablehq/aleo-wallet-adaptor-react](https://github.com/ProvableHQ/aleo-wallet-adapter) | Shield, Leo, Puzzle, Fox, Soter wallet support |
| [Provable Explorer API](https://api.explorer.provable.com/v2) | On-chain data & transaction history |

---

## Testing

v5 includes property-based tests for all bug conditions and preservation properties:

```bash
# Run bug condition exploration tests (verify bugs are fixed)
npx ts-node tests/bug_condition_exploration.ts

# Run preservation tests (verify no regressions)
npx ts-node tests/preservation_properties.ts
```

Both test suites pass on the deployed v5 contract.

---

## Contributing

PRs welcome. Before submitting:

```bash
cd frontend
pnpm lint
pnpm build   # ensure no TypeScript errors
```

Please open an issue first for significant changes.

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Built for the Aleo Privacy Buildathon 2026</strong><br/>
  <em>Proving that financial privacy and decentralization are not a tradeoff.</em>
</p>
