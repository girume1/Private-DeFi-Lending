import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  Box,
  Divider,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  AlertTitle
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Lock as LockIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { usePrivLend } from '../context/PrivLendContext';
import { PROGRAM_ID } from '../utils/aleo';
import toast from 'react-hot-toast';

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  onOpenCreditTier?: () => void;
}

interface AleoRecord {
  id: string;
  owner?: string;
  program_id?: string;
  spent?: boolean;
  data?: any;
  [key: string]: any;
}

const steps = ['Private Proof', 'Public Registry', 'Completed'];

export const LoanCreationForm: React.FC<Props> = ({
  onSuccess,
  onClose,
  onOpenCreditTier
}) => {
  const {
    connected,
    address,
    executeTransaction,
    transactionStatus,
    requestRecords
  } = useWallet();

  const {
    currentBlock,
    loanCounter,
    refreshData
  } = usePrivLend();

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasCreditTier, setHasCreditTier] = useState(false);
  const [checkingTier, setCheckingTier] = useState(true);
  const [manualChecking, setManualChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    lender: '',
    principal: 1000,
    collateral: 1500,
    interest_bps: 500,
    duration_blocks: 43200
  });

  // Debug function to check credit tier
  const debugCreditTier = async () => {
    if (!connected || !requestRecords || !address) {
      setDebugInfo('Not connected or no address');
      return false;
    }

    try {
      console.log("🔍 Starting credit tier debug...");
      console.log("👤 Current address:", address);
      
      const records = await requestRecords(PROGRAM_ID) as AleoRecord[];
      console.log("📦 All records received:", records.length);
      console.log("📦 Full records:", JSON.stringify(records, null, 2));

      if (records.length === 0) {
        setDebugInfo('No records found in wallet');
        return false;
      }

      // Log all record structures
      records.forEach((r, i) => {
        console.log(`Record ${i}:`, {
          id: r.id,
          spent: r.spent,
          owner: r.owner,
          program_id: r.program_id,
          dataKeys: r.data ? Object.keys(r.data) : 'no data',
          data: r.data
        });
      });

      // Check for credit tier records
      const tierRecords = records.filter(r => {
        // Check various possible structures
        const hasTierData = r.data && (
          r.data.tier !== undefined ||
          r.data.tier === 0 ||
          r.data.tier === 1 ||
          r.data.tier === 2 ||
          (r.data.value && r.data.value.tier !== undefined) ||
          (typeof r.data === 'object' && 'tier' in r.data)
        );

        const isUnspent = !r.spent;
        
        // Check if record belongs to current user
        const belongsToUser = !r.owner || r.owner === address;

        if (hasTierData) {
          console.log("🎯 Potential tier record found:", {
            id: r.id,
            spent: r.spent,
            owner: r.owner,
            data: r.data,
            belongsToUser,
            isUnspent
          });
        }

        return hasTierData && isUnspent && belongsToUser;
      });

      console.log("✅ Valid tier records found:", tierRecords.length);
      
      if (tierRecords.length > 0) {
        setDebugInfo(`Found ${tierRecords.length} valid credit tier(s)`);
        return true;
      } else {
        setDebugInfo('No valid credit tier found');
        return false;
      }

    } catch (error) {
      console.error("❌ Debug error:", error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Check for credit tier when component mounts
  useEffect(() => {
    const checkCreditTier = async () => {
      if (!connected || !requestRecords || !address) {
        setHasCreditTier(false);
        setCheckingTier(false);
        return;
      }

      try {
        setCheckingTier(true);
        const hasValid = await debugCreditTier();
        setHasCreditTier(hasValid);
      } catch (error) {
        console.error('Error checking credit tier:', error);
        setHasCreditTier(false);
      } finally {
        setCheckingTier(false);
      }
    };

    checkCreditTier();
  }, [connected, requestRecords, address]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleSliderChange = (field: string) => (_: any, value: number | number[]) => {
    const v = value as number;
    setFormData(prev => ({
      ...prev,
      [field]: v,
      ...(field === 'principal' && {
        collateral: Math.round(v * 1.5)
      })
    }));
  };

  const manuallyCheckTier = async () => {
    if (!connected || !requestRecords || !address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    setManualChecking(true);
    try {
      const hasValid = await debugCreditTier();
      setHasCreditTier(hasValid);
      
      if (hasValid) {
        toast.success('Credit tier found!');
      } else {
        toast.error('No valid credit tier found. Check console for details.');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to check credit tier');
    } finally {
      setManualChecking(false);
    }
  };

  const waitForConfirmation = async (txId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20; // 60 seconds max (20 * 3s)

      pollingRef.current = setInterval(async () => {
        attempts++;
        
        try {
          const status = await transactionStatus(txId);
          const statusText = typeof status === 'string' ? status : status?.status;
          const s = statusText?.toLowerCase() || '';

          if (s.includes('accepted') || s.includes('completed') || s.includes('success')) {
            clearInterval(pollingRef.current!);
            resolve(true);
            return;
          }

          if (s.includes('failed') || s.includes('rejected') || s.includes('error')) {
            clearInterval(pollingRef.current!);
            resolve(false);
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollingRef.current!);
            resolve(false); // Timeout
            return;
          }
        } catch (error) {
          console.error('Polling error:', error);
          // Don't clear on error, continue polling
        }
      }, 3000);
    });
  };

  const handleSubmit = async () => {
    if (!connected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!hasCreditTier) {
      toast.error('You need to create a credit tier first');
      return;
    }

    if (loading) return;

    setLoading(true);
    const toastId = toast.loading('Preparing transaction...');

    try {
      // Get credit tier record
      const records = await requestRecords(PROGRAM_ID) as AleoRecord[];
      const tierRecord = records.find(r => {
        const hasTierData = r.data && (
          r.data.tier !== undefined ||
          r.data.tier === 0 ||
          r.data.tier === 1 ||
          r.data.tier === 2
        );
        return hasTierData && !r.spent;
      });

      if (!tierRecord) {
        throw new Error('No valid credit tier found. Please create one first.');
      }

      console.log("✅ Using credit tier:", tierRecord);

      const newLoanId = (loanCounter || 0) + 1;

      // ==============================
      // STEP 1 — Private Transaction
      // ==============================
      setActiveStep(0);
      toast.loading('Step 1: Creating private loan record...', { id: toastId });

      const privateTx = await executeTransaction({
        program: PROGRAM_ID,
        function: 'create_loan_private',
        inputs: [
          `${newLoanId}u32`,
          `${currentBlock || 0}u32`,
          formData.lender,
          tierRecord.id,
          `${formData.principal}u64`,
          `${formData.collateral}u64`,
          `${formData.interest_bps}u16`,
          `${formData.duration_blocks}u32`
        ],
        fee: 250_000, // 0.25 ALEO
        privateFee: false
      });

      if (!privateTx?.transactionId) {
        throw new Error('Failed to submit private transaction');
      }

      toast.loading('Step 1: Waiting for confirmation...', { id: toastId });

      const privateOk = await waitForConfirmation(privateTx.transactionId);
      if (!privateOk) {
        throw new Error('Private transaction was not confirmed');
      }

      // ==============================
      // STEP 2 — Public Registration
      // ==============================
      setActiveStep(1);
      toast.loading('Step 2: Registering loan publicly...', { id: toastId });

      const publicTx = await executeTransaction({
        program: PROGRAM_ID,
        function: 'register_loan_public',
        inputs: [
          `${newLoanId}u32`,
          address,
          `${currentBlock || 0}u32`,
          `${formData.duration_blocks}u32`
        ],
        fee: 100_000, // 0.1 ALEO
        privateFee: false
      });

      if (!publicTx?.transactionId) {
        throw new Error('Failed to submit public transaction');
      }

      toast.loading('Step 2: Waiting for confirmation...', { id: toastId });

      const publicOk = await waitForConfirmation(publicTx.transactionId);
      if (!publicOk) {
        throw new Error('Public transaction was not confirmed');
      }

      // ==============================
      // STEP 3 — Success
      // ==============================
      setActiveStep(2);
      toast.success('Loan created successfully!', { id: toastId });

      await refreshData();
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Loan creation error:', err);
      toast.error(err.message || 'Loan creation failed', { id: toastId });
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  // Validation
  const isValidLender = formData.lender.startsWith('aleo1') && formData.lender.length === 63;
  const isValidPrincipal = formData.principal >= 100;
  const isValidCollateral = formData.collateral >= formData.principal * 1.5;
  const isValid = isValidLender && isValidPrincipal && isValidCollateral && hasCreditTier && !checkingTier;

  if (checkingTier) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Checking credit tier...</Typography>
      </Paper>
    );
  }

  if (!hasCreditTier && !checkingTier) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>Credit Tier Required</Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            You need to create a credit tier before creating a loan.
          </Typography>
          
          {/* Debug info */}
          {debugInfo && (
            <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
              <AlertTitle>Debug Info</AlertTitle>
              <Typography variant="body2" component="pre" sx={{ fontSize: '0.8rem' }}>
                {debugInfo}
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                onClose();
                if (onOpenCreditTier) {
                  onOpenCreditTier();
                }
              }}
            >
              Create Credit Tier
            </Button>
            <Button 
              variant="text"
              onClick={manuallyCheckTier}
              disabled={manualChecking}
              startIcon={manualChecking ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {manualChecking ? 'Checking...' : 'Refresh Check'}
            </Button>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 4 },
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid #334155',
        borderRadius: 4
      }}
    >
      {/* Debug info (remove in production) */}
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="caption">{debugInfo}</Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <motion.div
          animate={{ rotate: loading ? 360 : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
        </motion.div>
        <Typography variant="h4" fontWeight="bold">
          Create New Loan
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Lender Address"
            value={formData.lender}
            onChange={e => setFormData({ ...formData, lender: e.target.value })}
            error={formData.lender !== '' && !formData.lender.startsWith('aleo1')}
            helperText={
              formData.lender !== '' && !formData.lender.startsWith('aleo1')
                ? 'Must start with aleo1'
                : ''
            }
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Typography gutterBottom>Principal (ALEO)</Typography>
          <Slider
            value={formData.principal}
            onChange={handleSliderChange('principal')}
            min={100}
            max={10000}
            step={100}
            valueLabelDisplay="auto"
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            value={formData.principal}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFormData(prev => ({
                ...prev,
                principal: val,
                collateral: Math.round(val * 1.5)
              }));
            }}
            inputProps={{ min: 100, max: 10000 }}
            sx={{ mt: 1 }}
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography gutterBottom>Collateral (ALEO)</Typography>
          <Slider
            value={formData.collateral}
            onChange={handleSliderChange('collateral')}
            min={formData.principal * 1.5}
            max={formData.principal * 5}
            step={100}
            valueLabelDisplay="auto"
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            value={formData.collateral}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              collateral: Number(e.target.value)
            }))}
            error={formData.collateral < formData.principal * 1.5}
            helperText={
              formData.collateral < formData.principal * 1.5
                ? 'Minimum 150% collateral required'
                : ''
            }
            sx={{ mt: 1 }}
            disabled={loading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Loan ID: <strong>{loanCounter + 1}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            LTV: <strong>{((formData.principal / formData.collateral) * 100).toFixed(1)}%</strong>
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!isValid || loading}
          sx={{
            px: 4,
            py: 1.5,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 2
          }}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
        >
          {loading ? 'Processing...' : 'Create Private Loan'}
        </Button>
      </Box>
    </Paper>
  );
};