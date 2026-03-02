import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon
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
    interest_bps?: string | number;
    status?: string | number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function parseAleoNumber(v: string | number | undefined): bigint {
  if (v === undefined) return 0n;
  const s = String(v).replace(/u\d+$/, '').replace(/i\d+$/, '').trim();
  try { return BigInt(s); } catch { return 0n; }
}

function recordMatchesLoanId(record: PrivateLoanRecord, loanId: number): boolean {
  const rid = record.data?.loan_id;
  if (rid === undefined) return false;
  return (
    rid === loanId ||
    rid === `${loanId}u32` ||
    Number(String(rid).replace('u32', '')) === loanId
  );
}

export const LoanCard: React.FC<{
  loan: LoanPublic;
  onUpdate: () => void;
}> = ({ loan, onUpdate }) => {
  const { connected, executeTransaction, requestRecords, transactionStatus } = useWallet();
  const { currentBlock } = usePrivLend();

  const [loading, setLoading] = useState(false);

  const remainingBlocks = useMemo(
    () => loan.deadline - currentBlock,
    [loan.deadline, currentBlock]
  );

  const isExpired = remainingBlocks <= 0;

  const statusLabel =
    !loan.active ? 'SETTLED' : isExpired ? 'LIQUIDATABLE' : 'ACTIVE';

  const statusColor =
    !loan.active ? 'success' : isExpired ? 'error' : 'warning';

  const pollUntilSettled = async (txId: string): Promise<boolean> => {
    return new Promise(resolve => {
      let attempts = 0;
      const MAX = 30;

      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await transactionStatus(txId);
          const s = (
            typeof res === 'string'
              ? res
              : (res as { status?: string })?.status ?? ''
          ).toLowerCase();

          if (s.includes('accepted') || s.includes('completed') || s.includes('finalized')) {
            clearInterval(interval);
            resolve(true);
          } else if (s.includes('failed') || s.includes('rejected')) {
            clearInterval(interval);
            resolve(false);
          } else if (attempts >= MAX) {
            clearInterval(interval);
            resolve(false);
          }
        } catch {
          
        }
      }, 3000);
    });
  };

  const handleRepay = async () => {
    if (!connected) return toast.error('Connect wallet first');

    setLoading(true);
    const toastId = toast.loading('Finding private loan record…');

    try {
      const records = (await requestRecords(PROGRAM_ID)) as PrivateLoanRecord[];

      const loanRecord = records.find(r => {
        if (r.spent) return false;
        if (!recordMatchesLoanId(r, loan.loan_id)) return false;
        const status = r.data?.status;
        return status === 0 || status === '0u8' || status === undefined;
      });

      if (!loanRecord) throw new Error('Private Loan record not found.');

      const principal = parseAleoNumber(loanRecord.data?.principal);
      const interestBps = parseAleoNumber(loanRecord.data?.interest_bps);
      const interestAmt = (principal * interestBps) / 10000n;
      const totalDue = principal + interestAmt;

      toast.loading('Submitting repayment…', { id: toastId });

      const repayTx = await executeTransaction({
        program: PROGRAM_ID,
        function: 'repay_private',
        inputs: [
          loanRecord.id,
          `${totalDue}u64`
        ],
        fee: 150_000,
        privateFee: false
      });

      if (!repayTx?.transactionId)
        throw new Error('repay_private TX failed');

      toast.loading('Waiting for confirmation…', { id: toastId });

      const repayOk = await pollUntilSettled(repayTx.transactionId);
      if (!repayOk)
        throw new Error('Repayment not confirmed');

      await executeTransaction({
        program: PROGRAM_ID,
        function: 'mark_repaid_public',
        inputs: [`${loan.loan_id}u32`],
        fee: 50_000,
        privateFee: false
      });

      toast.success('Loan repaid successfully!', { id: toastId });
      onUpdate();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Repayment failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleLiquidate = async () => {
    if (!connected) return toast.error('Connect wallet first');

    setLoading(true);
    const toastId = toast.loading('Executing liquidation…');

    try {
      const result = await executeTransaction({
        program: PROGRAM_ID,
        function: 'liquidate_public',
        inputs: [`${loan.loan_id}u32`],
        fee: 100_000,
        privateFee: false
      });

      if (!result?.transactionId)
        throw new Error('liquidation failed');

      const ok = await pollUntilSettled(result.transactionId);

      if (!ok)
        throw new Error('Liquidation not confirmed');

      toast.success('Loan liquidated!', { id: toastId });
      onUpdate(); 

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Liquidation failed';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
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
          <Box display="flex" justifyContent="space-between" mb={2}>
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

          <Typography variant="body2" color="text.secondary">
            Owner: {loan.owner.slice(0, 10)}…{loan.owner.slice(-6)}
          </Typography>

          <Typography variant="body2" sx={{ mt: 1 }}>
            Deadline: Block <strong>{loan.deadline}</strong>
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Current: Block {currentBlock}
          </Typography>

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
        </CardContent>

        <CardActions sx={{ p: 2 }}>
          {loan.active ? (
            <Button
              fullWidth
              variant="contained"
              onClick={isExpired ? handleLiquidate : handleRepay}
              disabled={loading}
              color={isExpired ? 'error' : 'primary'}
              startIcon={
                loading
                  ? <CircularProgress size={16} color="inherit" />
                  : isExpired
                  ? <WarningIcon />
                  : <PaymentIcon />
              }
            >
              {loading
                ? 'Processing…'
                : isExpired
                ? 'Liquidate'
                : 'Repay Loan'}
            </Button>
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