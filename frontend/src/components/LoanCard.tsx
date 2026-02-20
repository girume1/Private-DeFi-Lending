import React, { useState } from 'react';
import { Card, CardContent, CardActions, Typography, Box, Chip, Button, CircularProgress } from '@mui/material';
import { 
  Lock as LockIcon, CheckCircle as CheckIcon, 
  Payment as PaymentIcon, Warning as WarningIcon 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { LoanPublic } from '../types';
import { usePrivLend } from '../context/PrivLendContext';
import { PROGRAM_ID } from '../utils/aleo';
import toast from 'react-hot-toast';

interface PrivateLoanRecord {
  id: string;
  data: { loan_id: string; principal: string; [key: string]: any };
  spent: boolean;
}

export const LoanCard: React.FC<{ loan: LoanPublic; onUpdate: () => void }> = ({ loan, onUpdate }) => {
  const { connected, executeTransaction, requestRecords, transactionStatus } = useWallet();
  const { currentBlock } = usePrivLend();
  const [loading, setLoading] = useState(false);

  const isExpired = currentBlock > loan.deadline;

  const pollStatus = (txId: string, toastId: string, isRepay: boolean) => {
    const interval = setInterval(async () => {
      try {
        const res = await transactionStatus(txId);
        const status = res.status.toLowerCase();
        if (status === 'accepted' || status === 'completed') {
          clearInterval(interval);
          if (isRepay) {
            toast.loading("Record burned! Updating public registry...", { id: toastId });
            await executeTransaction({ 
              program: PROGRAM_ID, function: 'mark_repaid_public', 
              inputs: [`${loan.loan_id}u32`], fee: 50000 
            });
          }
          toast.success("Transaction Confirmed!", { id: toastId });
          onUpdate();
          setLoading(false);
        } else if (['failed', 'rejected'].includes(status)) {
          clearInterval(interval);
          toast.error("Transaction failed", { id: toastId });
          setLoading(false);
        }
      } catch (e) { console.error(e); }
    }, 3000);
  };

  const handleRepay = async () => {
    if (!connected) return toast.error("Connect wallet");
    setLoading(true);
    const toastId = toast.loading("Finding private loan record...");
    try {
      const records = (await requestRecords(PROGRAM_ID)) as PrivateLoanRecord[];
      const loanRecord = records.find(r => r.data.loan_id === `${loan.loan_id}u32` && !r.spent);
      if (!loanRecord) throw new Error("Private record not found in wallet.");

      const result = await executeTransaction({
        program: PROGRAM_ID, function: 'repay_loan_private',
        inputs: [loanRecord.id, loanRecord.data.principal], fee: 150000,
      });
      if (result?.transactionId) pollStatus(result.transactionId, toastId, true);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

  const handleLiquidate = async () => {
    setLoading(true);
    const toastId = toast.loading("Executing public liquidation...");
    try {
      const result = await executeTransaction({
        program: PROGRAM_ID, function: 'liquidate_loan',
        inputs: [`${loan.loan_id}u32`], fee: 100000,
      });
      if (result?.transactionId) pollStatus(result.transactionId, toastId, false);
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <motion.div whileHover={{ y: -5 }}>
      <Card sx={{ background: 'linear-gradient(145deg, #1e293b, #0f172a)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="h6" color="primary">Loan #{loan.loan_id}</Typography>
            <Chip 
              icon={loan.active ? <LockIcon style={{ color: 'inherit' }} /> : <CheckIcon style={{ color: 'inherit' }} />} 
              label={loan.active ? (isExpired ? "EXPIRED" : "ACTIVE") : "PAID"} 
              color={loan.active ? (isExpired ? "error" : "warning") : "success"} 
            />
          </Box>
          <Typography variant="body2">Deadline: Block {loan.deadline}</Typography>
          <Typography variant="caption" color="text.secondary">Current: Block {currentBlock}</Typography>
        </CardContent>
        <CardActions sx={{ p: 2 }}>
          {loan.active ? (
            <Button 
              fullWidth variant="contained" 
              onClick={isExpired ? handleLiquidate : handleRepay} 
              disabled={loading}
              color={isExpired ? "error" : "primary"}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : (isExpired ? <WarningIcon /> : <PaymentIcon />)}
            >
              {loading ? "Processing..." : (isExpired ? "Liquidate" : "Repay Loan")}
            </Button>
          ) : (
            <Button fullWidth disabled variant="outlined" sx={{ borderColor: 'success.main', color: 'success.main' }}>Settled</Button>
          )}
        </CardActions>
      </Card>
    </motion.div>
  );
};