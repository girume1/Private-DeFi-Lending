import React, { useState, useEffect, useRef } from 'react';
import {
  Paper, Typography, TextField, Button,  Slider, Box, Chip, 
  Divider, Stepper, Step, StepLabel, CircularProgress, Alert
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Lock as LockIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { usePrivLend } from '../context/PrivLendContext';
import { PROGRAM_ID } from '../utils/aleo';
import toast from 'react-hot-toast';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

interface AleoRecord {
  id: string;
  data: {
    tier?: any;
    [key: string]: any;
  };
  spent: boolean;
}

const steps = ['Private Proof', 'Public Registry', 'Finalizing'];

export const LoanCreationForm: React.FC<Props> = ({ onSuccess, onClose }) => {
  const { connected, address, executeTransaction, transactionStatus, requestRecords } = useWallet();
  const { currentBlock, loanCounter, refreshData } = usePrivLend();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    lender: '',
    principal: 1000,
    collateral: 1500,
    interest_bps: 500,
    duration_blocks: 43200
  });

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleSliderChange = (field: string) => (_event: Event, value: number | number[]) => {
    const newValue = value as number;
    setFormData(prev => ({
      ...prev,
      [field]: newValue,
      ...(field === 'principal' && { collateral: Math.round(newValue * 1.5) })
    }));
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'principal' && { collateral: Math.round(value * 1.5) })
    }));
  };

  const handleSubmit = async () => {
    if (!connected || !address) return toast.error('Connect wallet first');
    setLoading(true);

    try {
      // 1. Fetch Records and cast to our interface
      const records = (await requestRecords(PROGRAM_ID)) as AleoRecord[];
      
     
      const tierRecordObj = records.find((r: AleoRecord) => r.data.tier !== undefined && !r.spent);
      
      if (!tierRecordObj) {
        throw new Error("No Credit Tier found. Please create one first.");
      }

      // The SDK expects the record as a string if it's being passed as an input
      const tierRecord = tierRecordObj.id;

      setActiveStep(0);
      const createRes = await executeTransaction({
        program: PROGRAM_ID,
        function: "create_loan_private",
        inputs: [
          `${loanCounter + 1}u32`,
          `${currentBlock}u32`,
          formData.lender,
          tierRecord, 
          `${formData.principal}u64`,
          `${formData.collateral}u64`,
          `${formData.interest_bps}u16`,
          `${formData.duration_blocks}u32`
        ],
        fee: 250000,
      });

      if (createRes?.transactionId) {
        toast.loading("Step 1: Confirming private proof...", { id: 'tx-wait' });
        
        pollingRef.current = setInterval(async () => {
          const status = await transactionStatus(createRes.transactionId);
          
          if (status.status.toLowerCase() === 'accepted' || status.status.toLowerCase() === 'completed') {
            clearInterval(pollingRef.current!);
            setActiveStep(1);
            
            const regRes = await executeTransaction({
              program: PROGRAM_ID,
              function: "register_loan_public",
              inputs: [
                `${loanCounter + 1}u32`,
                address,
                `${currentBlock}u32`,
                `${formData.duration_blocks}u32`
              ],
              fee: 100000,
            });

            if (regRes?.transactionId) {
                const finalPoll = setInterval(async () => {
                    const finalStatus = await transactionStatus(regRes.transactionId);
                    if (finalStatus.status.toLowerCase() === 'accepted' || finalStatus.status.toLowerCase() === 'completed') {
                        clearInterval(finalPoll);
                        setActiveStep(2);
                        toast.success("Loan Created Successfully!", { id: 'tx-wait' });
                        await refreshData();
                        setTimeout(() => { onSuccess(); onClose(); }, 2000);
                    }
                }, 3000);
            }
          }
        }, 3000);
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Creation failed', { id: 'tx-wait' });
      setLoading(false);
    }
  };

  const blocksToDays = (blocks: number) => Math.round(blocks / 144);
  const daysToBlocks = (days: number) => days * 144;
  const isValid = formData.collateral >= formData.principal * 1.5 && 
                  formData.lender.startsWith('aleo1') &&
                  formData.principal > 0;

  return (
    <Paper sx={{ p: 4, background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #334155', borderRadius: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <motion.div animate={{ rotate: loading ? 360 : 0 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </motion.div>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Create New Loan</Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}><StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>{label}</StepLabel></Step>
        ))}
      </Stepper>
      
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField fullWidth label="Lender Address" value={formData.lender} onChange={(e) => setFormData({...formData, lender: e.target.value})} placeholder="aleo1..." sx={{ mb: 3 }} />
          <Typography gutterBottom>Principal (ALEO)</Typography>
          <Slider value={formData.principal} onChange={handleSliderChange('principal')} min={100} max={10000} step={100} sx={{ mb: 2 }} />
          <TextField fullWidth type="number" value={formData.principal} onChange={handleInputChange('principal')} sx={{ mb: 3 }} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography gutterBottom>Collateral (ALEO)</Typography>
          <Slider value={formData.collateral} onChange={handleSliderChange('collateral')} min={formData.principal * 1.5} max={formData.principal * 5} sx={{ mb: 2 }} />
          <TextField fullWidth type="number" value={formData.collateral} onChange={handleInputChange('collateral')} error={formData.collateral < formData.principal * 1.5} helperText={formData.collateral < formData.principal * 1.5 ? 'Min 150% required' : ''} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">Loan ID: <strong>{loanCounter + 1}</strong></Typography>
          <Typography variant="body2" color="text.secondary">LTV: <strong>{(formData.principal / formData.collateral * 100).toFixed(1)}%</strong></Typography>
        </Box>

        <Button
          variant="contained" size="large" onClick={handleSubmit}
          disabled={loading || !isValid}
          sx={{ px: 4, py: 1.5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 2 }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        >
          {loading ? 'Processing...' : 'Create Private Loan'}
        </Button>
      </Box>
    </Paper>
  );
};