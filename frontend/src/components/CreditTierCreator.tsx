import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  LinearProgress,
  SelectChangeEvent,
  CircularProgress
} from '@mui/material';
import {
  Grade as GradeIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROGRAM_ID } from '../utils/aleo';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TierInfo {
  name: string;
  color: string;
  description: string;
}

const tierInfo: Record<number, TierInfo> = {
  0: { 
    name: 'Tier A', 
    color: '#10b981', 
    description: 'Best rates (0-5% APR), highest borrowing power up to 100k ALEO' 
  },
  1: { 
    name: 'Tier B', 
    color: '#f59e0b', 
    description: 'Good rates (5-10% APR), standard borrowing up to 50k ALEO' 
  },
  2: { 
    name: 'Tier C', 
    color: '#ef4444', 
    description: 'Fair rates (10-20% APR), limited borrowing up to 10k ALEO' 
  }
};

export const CreditTierCreator: React.FC<Props> = ({ open, onClose, onSuccess }) => {
  const { connected, address, executeTransaction, transactionStatus } = useWallet();
  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleTierChange = (event: SelectChangeEvent<number>) => {
    setSelectedTier(event.target.value as 0 | 1 | 2);
  };

  /**
   * Generates a random number string formatted as an Aleo 'field'
   */
  const generateAleoFieldNonce = (): string => {
    const randomBigInt = BigInt('0x' + Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, '0')).join(''));
    return `${randomBigInt}field`;
  };

  const handleCreate = async () => {
    if (!connected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStep(2); // Show loading state

    try {
      const nonce = generateAleoFieldNonce();
      
      // Corrected: use executeTransaction instead of requestTransactionHistory
      const result = await executeTransaction({
        program: PROGRAM_ID,
        function: "create_credit_tier",
        inputs: [
          `${selectedTier}u8`,
          nonce
        ],
        fee: 150000, // microcredits
        privateFee: false
      });

      if (result?.transactionId) {
        console.log('Transaction submitted, temporary ID:', result.transactionId);
        
        // Start Polling for Status (Recommended by Aleo Dev Toolkit)
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await transactionStatus(result.transactionId);
            console.log("Current Transaction Status:", statusRes.status);

            if (statusRes.status.toLowerCase() === 'accepted' || statusRes.status.toLowerCase() === 'completed') {
              clearInterval(pollInterval);
              setStep(3); // Success state
              toast.success('Credit tier created and accepted on-chain!');
              
              setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
              }, 2500);
            } else if (['failed', 'rejected'].includes(statusRes.status.toLowerCase())) {
              clearInterval(pollInterval);
              throw new Error("Transaction was rejected on-chain");
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        }, 3000); // Check every 3 seconds
      }
      
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to create credit tier');
      setStep(1);
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: 4,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0 }}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        </motion.div>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Create Credit Tier
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Secure your borrowing identity with Zero-Knowledge
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Credit Tier</InputLabel>
                <Select
                  value={selectedTier}
                  onChange={handleTierChange}
                  label="Select Credit Tier"
                >
                  {[0, 1, 2].map((t) => (
                    <MenuItem key={t} value={t}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GradeIcon sx={{ color: tierInfo[t].color }} />
                        <span>{tierInfo[t].name}</span>
                        <Chip 
                          label={t === 0 ? "Elite" : t === 1 ? "Standard" : "Starter"} 
                          size="small" 
                          sx={{ bgcolor: tierInfo[t].color, color: 'white', ml: 1 }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Alert 
                severity="info" 
                sx={{ 
                  mt: 3, 
                  bgcolor: `${tierInfo[selectedTier].color}20`,
                  border: `1px solid ${tierInfo[selectedTier].color}40`,
                  '& .MuiAlert-icon': { color: tierInfo[selectedTier].color }
                }}
              >
                {tierInfo[selectedTier].description}
              </Alert>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                <CircularProgress size={60} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SecurityIcon color="primary" />
                </Box>
              </Box>
              <Typography variant="h6" gutterBottom>
                Processing Private Proof...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generating ZK-Record. This may take up to 30 seconds.
                Please check your wallet for a confirmation request.
              </Typography>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              <CheckIcon sx={{ fontSize: 80, color: 'success.main' }} />
              <Typography variant="h6" sx={{ mt: 2, color: 'success.main' }}>
                Credit Tier Confirmed!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Your private credit identity is now live on the Aleo network.
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {step === 1 && (
          <>
            <Button 
              onClick={onClose} 
              variant="outlined" 
              color="inherit"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={loading}
              sx={{
                background: `linear-gradient(135deg, ${tierInfo[selectedTier].color}, ${tierInfo[selectedTier].color}dd)`,
                borderRadius: 2,
                px: 4,
                '&:hover': {
                  background: `linear-gradient(135deg, ${tierInfo[selectedTier].color}, ${tierInfo[selectedTier].color})`,
                }
              }}
            >
              Initialize {tierInfo[selectedTier].name}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};