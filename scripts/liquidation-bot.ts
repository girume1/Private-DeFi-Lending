/**
 * PrivLend v6 — Liquidation Bot
 *
 * Polls the Aleo testnet for expired loans and prints liquidation candidates.
 * Run with: npx ts-node --project scripts/tsconfig.json scripts/liquidation-bot.ts
 *
 * To actually execute liquidations, integrate with the Aleo SDK and provide
 * a lender private key. This script is read-only by default (dry-run mode).
 */

const API      = process.env.ALEO_API      ?? 'https://api.explorer.provable.com/v2';
const NETWORK  = process.env.ALEO_NETWORK  ?? 'testnet';
const PROGRAM  = process.env.PROGRAM_ID    ?? 'privlend_v6.aleo';
const INTERVAL = Number(process.env.POLL_INTERVAL_MS ?? '30000'); // 30s default

interface ExpiredLoan {
  loan_id:  number;
  owner:    string;
  lender:   string;
  deadline: number;
}

async function fetchMapping(mapping: string, key: string): Promise<string | null> {
  try {
    const res = await fetch(`${API}/${NETWORK}/program/${PROGRAM}/mapping/${mapping}/${key}`);
    if (!res.ok) return null;
    const text = await res.text();
    return text.replace(/['"]/g, '').trim();
  } catch {
    return null;
  }
}

async function getLoanCounter(): Promise<number> {
  const val = await fetchMapping('loan_counter', '0u32');
  if (!val) return 0;
  const n = parseInt(val.replace(/u32$/i, ''), 10);
  return isNaN(n) ? 0 : n;
}

async function getCurrentBlock(): Promise<number> {
  try {
    const res = await fetch(`${API}/${NETWORK}/block/height/latest`);
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data === 'number' ? data : Number(data) || 0;
  } catch {
    return 0;
  }
}

async function scanExpiredLoans(currentBlock: number, totalLoans: number): Promise<ExpiredLoan[]> {
  const expired: ExpiredLoan[] = [];

  // Fetch all loans in parallel
  const checks = Array.from({ length: totalLoans }, async (_, i) => {
    const loan_id = i + 1;
    const id      = `${loan_id}u32`;

    const [active, deadline, owner, lender] = await Promise.all([
      fetchMapping('loan_active',   id),
      fetchMapping('loan_deadline', id),
      fetchMapping('loan_owner',    id),
      fetchMapping('loan_lender',   id),
    ]);

    if (active !== 'true') return;

    const deadlineBlock = parseInt((deadline ?? '0').replace(/u32$/i, ''), 10);
    if (isNaN(deadlineBlock) || currentBlock < deadlineBlock) return;

    expired.push({
      loan_id,
      owner:    owner  ?? 'unknown',
      lender:   lender ?? 'unknown',
      deadline: deadlineBlock,
    });
  });

  await Promise.all(checks);
  return expired.sort((a, b) => a.loan_id - b.loan_id);
}

async function runBot(): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`PrivLend v6 Liquidation Bot — ${new Date().toLocaleTimeString()}`);
  console.log(`Program: ${PROGRAM} | Network: ${NETWORK}`);
  console.log('='.repeat(60));

  const [currentBlock, totalLoans] = await Promise.all([
    getCurrentBlock(),
    getLoanCounter(),
  ]);

  console.log(`Current block: #${currentBlock.toLocaleString()}`);
  console.log(`Total loans:   ${totalLoans}`);

  if (totalLoans === 0) {
    console.log('No loans found.');
    return;
  }

  console.log(`\nScanning ${totalLoans} loan(s) for expired positions...`);
  const expired = await scanExpiredLoans(currentBlock, totalLoans);

  if (expired.length === 0) {
    console.log('✅ No expired loans found.');
    return;
  }

  console.log(`\n⚠️  Found ${expired.length} expired loan(s):\n`);
  for (const loan of expired) {
    const blocksOverdue = currentBlock - loan.deadline;
    console.log(`  Loan #${loan.loan_id}`);
    console.log(`    Borrower: ${loan.owner}`);
    console.log(`    Lender:   ${loan.lender}`);
    console.log(`    Deadline: block #${loan.deadline.toLocaleString()} (${blocksOverdue.toLocaleString()} blocks overdue)`);
    console.log(`    Explorer: https://testnet.explorer.provable.com/program/${PROGRAM}`);
    console.log();
  }

  console.log('--- Liquidation Command (dry-run) ---');
  console.log('To liquidate, call:');
  for (const loan of expired) {
    console.log(`  leo execute liquidate ${loan.loan_id}u32 <col_amount>u64 --network ${NETWORK}`);
  }
  console.log('\nNote: Replace <col_amount> with the actual collateral amount from the borrower\'s Collateral record.');
}

// Run once immediately, then poll
runBot().catch(console.error);

if (INTERVAL > 0) {
  setInterval(() => runBot().catch(console.error), INTERVAL);
  console.log(`\nBot running — polling every ${INTERVAL / 1000}s. Press Ctrl+C to stop.`);
}
