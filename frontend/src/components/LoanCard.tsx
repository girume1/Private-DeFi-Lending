import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  AccountBalance as BalanceIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { LoanPublic } from '../types';
import { usePrivLend } from '../context/PrivLendContext';
import { PROGRAM_ID } from '../utils/aleo';
import toast from 'react-hot-toast';

interface PrivateLoanRecord {
  id: string;
  spent?: boolean;
  data?: {
    loan_id?: string | number;
    principal?: string | number;
    collateral?: string | number;
    interest_bps?: string | number;
    status?: string | number;
    lender?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function parseAleoNumber(v: string | number | undefined): bigint {
  if (v === undefined) return 0n;
  const s = String(v)
    .replace(/\.private$/, '').replace(/\.public$/, '')
    .replace(/u\d+$/, '').replace(/i\d+$/, '')
    .trim();
  try { return BigInt(s); } catch { return 0n; }
}

function parsePlaintextStr(s: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {

    const normalised = s.trim()
      .replace(/^\{/, '').replace(/\}$/, '')
      .replace(/\r?\n/g, ',')
      .trim();

    let depth = 0, current = '';
    for (const ch of normalised) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (ch === ',' && depth === 0) {
        const idx = current.indexOf(':');
        if (idx !== -1) {
          const key = current.slice(0, idx).trim();
          const val = current.slice(idx + 1).trim();
          if (key) result[key] = val;
        }
        current = '';
      } else { current += ch; }
    }
    if (current.trim()) {
      const idx = current.indexOf(':');
      if (idx !== -1) {
        const key = current.slice(0, idx).trim();
        const val = current.slice(idx + 1).trim();
        if (key) result[key] = val;
      }
    }
  } catch {}
  return result;
}

function extractLoanId(record: PrivateLoanRecord): string | number | undefined {

  if (record.data?.loan_id !== undefined) return record.data.loan_id;
  const nested = (record.data as any)?.value;

  if (nested?.loan_id !== undefined) return nested.loan_id;
  const pt = (record as any)?.plaintext;
  if (typeof pt === 'object' && pt?.loan_id !== undefined) return pt.loan_id;

  if (typeof pt === 'string' && pt.includes('loan_id')) {
    const parsed = parsePlaintextStr(pt);
    if (parsed.loan_id !== undefined) return parsed.loan_id;
  }

  if (typeof record.data === 'string' && (record.data as any).includes('loan_id')) {
    const parsed = parsePlaintextStr(record.data as any);
    if (parsed.loan_id !== undefined) return parsed.loan_id;
  }
  return undefined;
}

function normalizeLoanId(rid: string | number): number {
  return Number(String(rid).replace(/u32$/i, '').trim());
}

function recordMatchesLoanId(record: PrivateLoanRecord, loanId: number): boolean {
  const rid = extractLoanId(record);
  if (rid === undefined) return false;
  return normalizeLoanId(rid) === loanId;
}

// Extract rawData from any wallet record structure
function extractRawData(record: PrivateLoanRecord): Record<string, any> {

  if ((record.data as any)?.value && typeof (record.data as any).value === 'object')
    return (record.data as any).value;

  if (record.data && typeof record.data === 'object') return record.data as any;

  const pt = (record as any)?.plaintext;
  if (typeof pt === 'object' && pt !== null) return pt;

  if (typeof pt === 'string' && pt.includes('{')) return parsePlaintextStr(pt);

  if (typeof record.data === 'string') return parsePlaintextStr(record.data as any);
  return {};
}

export const LoanCard: React.FC<{
  loan: LoanPublic;
  onUpdate: () => void;
}> = ({ loan, onUpdate }) => {
  const walletCtx = useWallet() as any;
  const {
    connected, address, executeTransaction, requestRecords, transactionStatus, decrypt
  } = walletCtx;
  // prefer requestRecordPlaintexts (Shield/Leo) for richer record data
  const requestRecordPlaintexts: ((programId: string) => Promise<any>) | undefined =
    walletCtx.requestRecordPlaintexts;
  const { currentBlock, balances, refreshBalances } = usePrivLend();

  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'repay' | 'liquidate' | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string>('');


  const [estimatedPrincipal, setEstimatedPrincipal] = useState<bigint>(0n);
  const [estimatedInterestBps, setEstimatedInterestBps] = useState<bigint>(500n);
  const [estimatedDurationBlocks, setEstimatedDurationBlocks] = useState<number>(0);
  const [estimatedStartBlock, setEstimatedStartBlock] = useState<number>(0);

  const remainingBlocks = useMemo(
    () => loan.deadline - currentBlock,
    [loan.deadline, currentBlock]
  );

  const isExpired = remainingBlocks <= 0;
  const isBorrower = address === loan.owner;
  const isLender = address === loan.lender;

  // Time-based interest estimate (uses estimated values set after record fetch, or 0 before)
  const interestSoFar = useMemo(() => {
    if (estimatedPrincipal === 0n || estimatedDurationBlocks === 0) return 0n;
    const elapsed = BigInt(Math.max(0, currentBlock - estimatedStartBlock));
    const duration = BigInt(estimatedDurationBlocks);
    return (estimatedPrincipal * estimatedInterestBps * elapsed) / (10000n * duration);
  }, [estimatedPrincipal, estimatedInterestBps, estimatedDurationBlocks, estimatedStartBlock, currentBlock]);

  const totalDueEstimate = estimatedPrincipal + interestSoFar;

  // Validate payment amount input
  const parsedPayment = useMemo(() => {
    try { return BigInt(paymentAmount || '0'); } catch { return 0n; }
  }, [paymentAmount]);

  const statusLabel = !loan.active 
    ? 'SETTLED' 
    : isExpired 
      ? 'LIQUIDATABLE' 
      : 'ACTIVE';

  const statusColor = !loan.active 
    ? 'success' 
    : isExpired 
      ? 'error' 
      : 'warning';

  const pollUntilSettled = async (txId: string): Promise<boolean> => {
    return new Promise(resolve => {
      let attempts = 0;
      const MAX = 80; 

      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await transactionStatus(txId);
          const s = (
            typeof res === 'string'
              ? res
              : (res as { status?: string })?.status ?? ''
          ).toLowerCase();

          console.log('[PrivLend] tx status attempt', attempts, ':', s);

          if (s.includes('accepted') || s.includes('completed') || s.includes('finalized') || s.includes('success')) {
            clearInterval(interval);
            resolve(true);
          } else if (s.includes('failed') || s.includes('rejected')) {
            clearInterval(interval);
            resolve(false);
          } else if (attempts >= MAX) {
            clearInterval(interval);
            // Timeout — tx may still land on-chain; tell user to check explorer
            resolve(false);
          }
        } catch {
          // Ignore transient errors
        }
      }, 4000);
    });
  };

  const handleRepay = async () => {
    if (!connected) return toast.error('Connect wallet first');
    if (!isBorrower) return toast.error('Only the borrower can repay');

    setLoading(true);
    setAction('repay');
    const toastId = toast.loading('Finding private loan record…');

    try {

      let records: PrivateLoanRecord[] = [];

      if (requestRecordPlaintexts) {
        try {
          const result = await requestRecordPlaintexts(PROGRAM_ID);
          records = Array.isArray(result) ? result : (result as any)?.records ?? [];
        } catch (e) { console.warn('[PrivLend] requestRecordPlaintexts failed:', e); }
      }
      if (records.length === 0 && requestRecords) {
        try {
          const result = await requestRecords(PROGRAM_ID);
          records = Array.isArray(result) ? result : (result as any)?.records ?? [];
        } catch (e) { console.warn('[PrivLend] requestRecords fallback failed:', e); }
      }

      console.log('[PrivLend] All records for', PROGRAM_ID, JSON.stringify(records, null, 2));

      // Filter to unspent Loan records only
      const loanRecords = records.filter(r => {
        if (r.spent) return false;
        const name = (r as any).recordName ?? (r as any).name ?? '';
        const fn   = (r as any).functionName ?? '';
        // Match by recordName if available
        if (name) return name === 'Loan';
        // Fallback: match by functionName
        if (fn)   return fn === 'open_loan';
        // Last resort: try to match loan_id from decrypted data
        return recordMatchesLoanId(r, loan.loan_id);
      });

      console.log('[PrivLend] Unspent Loan records:', loanRecords.length);

      if (loanRecords.length === 0) {
        throw new Error(
          `No unspent Loan record found for loan #${loan.loan_id}. ` +
          `Total records: ${records.length}. The loan may already be repaid.`
        );
      }

      // If multiple unspent loans, pick the one matching loan_id when possible,
      // otherwise take the one whose blockHeight matches the loan creation order.
      let loanRecord = loanRecords.find(r => recordMatchesLoanId(r, loan.loan_id));
      if (!loanRecord) {

        const sorted = [...loanRecords].sort((a, b) =>
          ((a as any).blockHeight ?? 0) - ((b as any).blockHeight ?? 0)
        );
        // loan.loan_id is 1-based; index into sorted list
        loanRecord = sorted[loan.loan_id - 1] ?? sorted[0];
        console.log('[PrivLend] Matched by block order, using record at index', loan.loan_id - 1);
      }

      const rawData = extractRawData(loanRecord);
      let principal        = parseAleoNumber(rawData?.principal);
      let interestBps      = parseAleoNumber(rawData?.interest_bps);
      let startBlock       = Number(parseAleoNumber(rawData?.start_block));
      let durationBlocks   = Number(parseAleoNumber(rawData?.duration_blocks));

      console.log('[PrivLend] rawData from record:', JSON.stringify(rawData));
      console.log('[PrivLend] principal from record:', principal.toString(), '| interestBps:', interestBps.toString());

      if (principal === 0n) {
        console.warn('[PrivLend] principal unknown from record data');
      }
      if (interestBps === 0n) {
        interestBps = 500n;
        console.warn('[PrivLend] interest_bps unknown, defaulting 500bps (may be wrong)');
      }
      if (durationBlocks === 0) {
        durationBlocks = loan.deadline - (startBlock || (loan.deadline - 1440));
      }
      if (startBlock === 0) {
        startBlock = loan.deadline - durationBlocks;
      }

      // Time-based total due
      const elapsed = BigInt(Math.max(0, currentBlock - startBlock));
      const duration = BigInt(Math.max(1, durationBlocks));
      let interestAmount = (principal * interestBps * elapsed) / (10000n * duration);
      let totalDue = principal + interestAmount;

      setEstimatedPrincipal(principal);
      setEstimatedInterestBps(interestBps);
      setEstimatedDurationBlocks(durationBlocks);
      setEstimatedStartBlock(startBlock);

      const ciphertext = (loanRecord as any).recordCiphertext ?? (loanRecord as any).ciphertext ?? '';
      const existingPlaintext = typeof (loanRecord as any).plaintext === 'string'
        ? (loanRecord as any).plaintext as string
        : '';

      let loanInput: string;
      try {
        if (ciphertext && decrypt) {

          console.log('[PrivLend] Decrypting Loan record via wallet decrypt()...');
          loanInput = await decrypt(ciphertext);
          console.log('[PrivLend] Decrypted loanInput (first 60):', String(loanInput).slice(0, 60));
        } else if (existingPlaintext.trim().startsWith('{')) {

          loanInput = existingPlaintext;
          console.log('[PrivLend] Using existing plaintext string');
        } else if (ciphertext) {

          loanInput = ciphertext;
          console.log('[PrivLend] Fallback: passing raw ciphertext');
        } else {
          throw new Error('No valid Loan record found. Ensure your wallet has access to this program\'s records.');
        }
      } catch (decryptErr: any) {
        console.warn('[PrivLend] decrypt() failed, trying plaintext fallback:', decryptErr);
        loanInput = existingPlaintext || ciphertext;
        if (!loanInput) throw new Error('Could not obtain a valid Loan record input for repayment.');
      }


      if (typeof loanInput === 'string' && loanInput.trim().startsWith('{')) {
        const decoded = parsePlaintextStr(loanInput);
        const decPrincipal      = parseAleoNumber(decoded.principal);
        const decInterestBps    = parseAleoNumber(decoded.interest_bps);
        const decStartBlock     = Number(parseAleoNumber(decoded.start_block));
        const decDurationBlocks = Number(parseAleoNumber(decoded.duration_blocks));
        if (decPrincipal > 0n) {
          principal      = decPrincipal;
          interestBps    = decInterestBps > 0n ? decInterestBps : interestBps;
          startBlock     = decStartBlock > 0 ? decStartBlock : startBlock;
          durationBlocks = decDurationBlocks > 0 ? decDurationBlocks : durationBlocks;
          const elapsedDec  = BigInt(Math.max(0, currentBlock - startBlock));
          const durationDec = BigInt(Math.max(1, durationBlocks));
          interestAmount = (principal * interestBps * elapsedDec) / (10000n * durationDec);
          totalDue = principal + interestAmount;
          setEstimatedPrincipal(principal);
          setEstimatedInterestBps(interestBps);
          setEstimatedDurationBlocks(durationBlocks);
          setEstimatedStartBlock(startBlock);
          console.log('[PrivLend] totalDue re-derived from decrypted plaintext (time-based):', totalDue.toString());
        }
      }

      console.log('[PrivLend] repay_loan — loanInput type:', String(loanInput).startsWith('{') ? 'plaintext' : 'ciphertext', '| totalDue:', totalDue.toString());

      // Validate AFTER decrypt so we have the real values
      if (principal === 0n) {
        throw new Error('Cannot determine loan principal from record. Check browser console for details.');
      }

      // Determine actual payment: use user-specified amount or default to totalDue
      const actualPayment = parsedPayment > 0n ? parsedPayment : totalDue;

      if (actualPayment > totalDue) {
        throw new Error(`Payment ${actualPayment} exceeds total due ${totalDue}`);
      }
      if (actualPayment > balances.usdcx) {
        throw new Error(`Insufficient USDCx balance. Need ${actualPayment.toString()}, have ${balances.usdcx.toString()}`);
      }

      const repayTx = await executeTransaction({
        program: PROGRAM_ID,
        function: 'repay_loan',
        inputs: [
          loanInput,
          `${actualPayment}u128`,
          `${currentBlock}u32`,
        ],
        fee: 300_000,
        privateFee: false,
      });

      if (!repayTx?.transactionId)
        throw new Error('repay_loan TX failed — no transactionId returned');

      toast.loading('Waiting for confirmation…', { id: toastId });

      const repayOk = await pollUntilSettled(repayTx.transactionId);
      if (!repayOk)
        throw new Error('Repayment transaction was not confirmed on-chain');

      await refreshBalances();
      toast.success('Loan repaid successfully! 🎉', { id: toastId });
      onUpdate();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Repayment failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleLiquidate = async () => {
    if (!connected) return toast.error('Connect wallet first');
    if (!isLender && !isExpired) return toast.error('Only the lender can liquidate expired loans');

    setLoading(true);
    setAction('liquidate');
    const toastId = toast.loading('Executing liquidation…');

    try {
      // Fetch records to find the Collateral record for this loan
      let records: PrivateLoanRecord[] = [];

      if (requestRecordPlaintexts) {
        try {
          const result = await requestRecordPlaintexts(PROGRAM_ID);
          records = Array.isArray(result) ? result : (result as any)?.records ?? [];
        } catch (e) { console.warn('[PrivLend] requestRecordPlaintexts failed:', e); }
      }
      if (records.length === 0 && requestRecords) {
        try {
          const result = await requestRecords(PROGRAM_ID);
          records = Array.isArray(result) ? result : (result as any)?.records ?? [];
        } catch (e) { console.warn('[PrivLend] requestRecords fallback failed:', e); }
      }

      // Filter to unspent Collateral records matching this loan_id
      const collateralRecords = records.filter(r => {
        if (r.spent) return false;
        const name = (r as any).recordName ?? (r as any).name ?? '';
        const fn   = (r as any).functionName ?? '';
        if (name) return name === 'Collateral';
        if (fn)   return fn === 'open_loan'; // Collateral is also output of open_loan
        return false;
      }).filter(r => recordMatchesLoanId(r, loan.loan_id));

      if (collateralRecords.length === 0) {
        throw new Error(
          `No unspent Collateral record found for loan #${loan.loan_id}. ` +
          `The collateral may have already been released.`
        );
      }

      const collateralRecord = collateralRecords[0];
      const rawColData = extractRawData(collateralRecord);
      let colAmount = parseAleoNumber(rawColData?.amount);

      // Try to decrypt if needed to get the amount
      if (colAmount === 0n) {
        const ciphertext = (collateralRecord as any).recordCiphertext ?? (collateralRecord as any).ciphertext ?? '';
        const existingPlaintext = typeof (collateralRecord as any).plaintext === 'string'
          ? (collateralRecord as any).plaintext as string : '';
        try {
          let decoded = existingPlaintext;
          if (!decoded.trim().startsWith('{') && ciphertext && decrypt) {
            decoded = await decrypt(ciphertext);
          }
          if (decoded.trim().startsWith('{')) {
            const parsed = parsePlaintextStr(decoded);
            colAmount = parseAleoNumber(parsed.amount);
          }
        } catch (e) { console.warn('[PrivLend] Could not decrypt Collateral record:', e); }
      }

      if (colAmount === 0n) {
        throw new Error('Could not determine collateral amount from Collateral record.');
      }

      toast.loading('Executing liquidation…', { id: toastId });

      const result = await executeTransaction({
        program: PROGRAM_ID,
        function: 'liquidate',
        inputs: [
          `${loan.loan_id}u32`,
          `${colAmount}u64`,
        ],
        fee: 200_000,
        privateFee: false
      });

      if (!result?.transactionId)
        throw new Error('liquidation failed');

      const ok = await pollUntilSettled(result.transactionId);

      if (!ok)
        throw new Error('Liquidation not confirmed');

      await refreshBalances();
      toast.success('Loan liquidated!', { id: toastId });
      onUpdate();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Liquidation failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }}>
      <Card
        sx={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'white'
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="primary">
              Loan #{loan.loan_id}
            </Typography>

            <Chip
              icon={
                !loan.active
                  ? <CheckIcon />
                  : isExpired
                  ? <WarningIcon />
                  : <LockIcon />
              }
              label={statusLabel}
              color={statusColor as any}
              size="small"
            />
          </Box>

          <Box sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Borrower: {loan.owner.slice(0, 10)}…{loan.owner.slice(-6)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lender: {loan.lender.slice(0, 10)}…{loan.lender.slice(-6)}
            </Typography>
          </Box>

          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Collateral:
            </Typography>
            <Typography variant="h6" color={loan.collateral_locked ? 'warning.light' : 'success.light'}>
              {loan.collateral_locked ? '🔒 Locked' : '✅ Released'}
            </Typography>
          </Box>

          {/* Time-based interest display (shown when we have record data) */}
          {estimatedPrincipal > 0n && loan.active && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(245,158,11,0.08)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.2)' }}>
              <Typography variant="caption" color="text.secondary" display="block">Interest so far</Typography>
              <Typography variant="body2" fontWeight={700} color="info.light">
                {interestSoFar.toString()} USDCx
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>Total due if repaid now</Typography>
              <Typography variant="body2" fontWeight={700} color="primary.light">
                {totalDueEstimate.toString()} USDCx
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2">
              Deadline: Block <strong>{loan.deadline}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current: Block {currentBlock}
            </Typography>
          </Box>

          {loan.active && !isExpired && (
            <Typography mt={1} color="info.main" variant="body2">
              ⏳ {remainingBlocks.toLocaleString()} blocks remaining
            </Typography>
          )}

          {loan.active && isExpired && (
            <Typography mt={1} color="error.main" variant="body2">
              ⚠️ Expired {Math.abs(remainingBlocks).toLocaleString()} blocks ago
            </Typography>
          )}

          {isBorrower && (
            <Tooltip title="Your USDCx balance">
              <Chip
                icon={<BalanceIcon />}
                label={`USDCx: ${balances.usdcx.toString()}`}
                size="small"
                sx={{ mt: 1, mr: 1 }}
                variant="outlined"
              />
            </Tooltip>
          )}
        </CardContent>

        <CardActions sx={{ p: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {loan.active ? (
            <>
              {isBorrower && (
                <>
                  {/* Partial payment input */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Payment amount (USDCx)"
                    value={paymentAmount}
                    onChange={e => {
                      const val = e.target.value;
                      setPaymentAmount(val);
                      try {
                        const parsed = BigInt(val || '0');
                        if (parsed <= 0n) {
                          setPaymentError('Payment must be greater than 0');
                        } else if (totalDueEstimate > 0n && parsed > totalDueEstimate) {
                          setPaymentError(`Cannot exceed total due (${totalDueEstimate.toString()})`);
                        } else {
                          setPaymentError('');
                        }
                      } catch {
                        setPaymentError('Invalid amount');
                      }
                    }}
                    error={!!paymentError}
                    helperText={
                      paymentError ||
                      (totalDueEstimate > 0n && parsedPayment > 0n && parsedPayment < totalDueEstimate
                        ? `Remaining after payment: ${(totalDueEstimate - parsedPayment).toString()} USDCx`
                        : undefined)
                    }
                    InputProps={{
                      endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">USDCx</Typography></InputAdornment>
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleRepay}
                    disabled={loading || !!paymentError}
                    color="primary"
                    startIcon={
                      loading && action === 'repay'
                        ? <CircularProgress size={16} color="inherit" />
                        : <PaymentIcon />
                    }
                  >
                    {loading && action === 'repay' ? 'Processing…' : 'Repay'}
                  </Button>
                </>
              )}
              
              {isLender && isExpired && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLiquidate}
                  disabled={loading}
                  color="error"
                  startIcon={
                    loading && action === 'liquidate'
                      ? <CircularProgress size={16} color="inherit" />
                      : <WarningIcon />
                  }
                >
                  {loading && action === 'liquidate' ? 'Processing…' : 'Liquidate'}
                </Button>
              )}
            </>
          ) : (
            <Button
              fullWidth
              disabled
              variant="outlined"
              sx={{ borderColor: 'success.main', color: 'success.main' }}
            >
              Settled
            </Button>
          )}
        </CardActions>
      </Card>
    </motion.div>
  );
};