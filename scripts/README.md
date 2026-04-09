# scripts/

Off-chain utility scripts for the PrivLend protocol.

---

## liquidation-bot.ts

Polls the Aleo testnet for expired loans and prints the exact `leo execute liquidate` command for each one. Read-only by default — no transactions are sent.

### How it works

1. Reads `loan_counter` to get the total number of loans
2. Fetches `loan_active`, `loan_deadline`, `loan_owner`, `loan_lender`, and `loan_collateral` for every loan in parallel
3. Filters to loans where `loan_active == true` and `block.height >= loan_deadline`
4. Prints a liquidation command for each expired loan

The `loan_collateral` mapping (added in v8) stores the exact collateral amount publicly, so the bot can construct the full `liquidate` command without needing access to the borrower's private `Collateral` record.

### Usage

```bash
# Run once (dry-run)
npx ts-node --project scripts/tsconfig.json scripts/liquidation-bot.ts

# Run with continuous polling every 60 seconds
POLL_INTERVAL_MS=60000 npx ts-node --project scripts/tsconfig.json scripts/liquidation-bot.ts

# Point at a different program or network
PROGRAM_ID=privlend_v8.aleo ALEO_NETWORK=testnet npx ts-node --project scripts/tsconfig.json scripts/liquidation-bot.ts
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ALEO_API` | `https://api.explorer.provable.com/v2` | Provable Explorer API base URL |
| `ALEO_NETWORK` | `testnet` | Aleo network (`testnet` or `mainnet`) |
| `PROGRAM_ID` | `privlend_v8.aleo` | Program ID to scan |
| `POLL_INTERVAL_MS` | `30000` | Polling interval in ms (`0` = run once and exit) |

### Example Output

```
============================================================
PrivLend v8 Liquidation Bot — 14:32:01
Program: privlend_v8.aleo | Network: testnet
============================================================
Current block: #15,503,730
Total loans:   4

Scanning 4 loan(s) for expired positions...

⚠️  Found 1 expired loan(s):

  Loan #2
    Borrower: aleo1abc...
    Lender:   aleo1xyz...
    Deadline: block #15,500,000 (3,730 blocks overdue)
    Explorer: https://testnet.explorer.provable.com/program/privlend_v8.aleo

--- Liquidation Commands (dry-run) ---
To liquidate, run these commands as the lender:
  leo execute liquidate 2u32 1500000u64 --network testnet --program privlend_v8.aleo
```

### Prerequisites

```bash
# Install ts-node globally (one-time)
npm install -g ts-node typescript

# Or use npx (no install needed)
npx ts-node --version
```

### Notes

- The bot is **read-only** — it only reads public chain state and prints commands
- Only the **registered lender** for a loan can successfully execute `liquidate`
- The `col_amount` in the command comes from the public `loan_collateral` mapping — it must match exactly or the transaction will be rejected on-chain
- After liquidation, the lender receives the collateral and the loan is closed

---

## tsconfig.json

TypeScript compiler config for running scripts with `ts-node`. Uses `commonjs` module format required by ts-node.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["./**/*.ts"]
}
```
