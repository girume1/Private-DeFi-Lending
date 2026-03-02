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
    description: 'Best rates (0-5% APR), highest borrowing power.'
  },
  1: {
    name: 'Tier B',
    color: '#f59e0b',
    description: 'Good rates (5-10% APR), standard borrowing.'
  },
  2: {
    name: 'Tier C',
    color: '#ef4444',
    description: 'Higher risk (10-20% APR), limited borrowing.'
  }
};

export const CreditTierCreator: React.FC<Props> = ({
  open,
  onClose,
  onSuccess
}) => {
  const {
    connected,
    address,
    executeTransaction,
    transactionStatus
  } = useWallet();

  const [selectedTier, setSelectedTier] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleTierChange = (event: SelectChangeEvent<number>) => {
    setSelectedTier(event.target.value as 0 | 1 | 2);
  };

  // Generate random Aleo field nonce
  const generateNonce = (): string => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${BigInt('0x' + hex)}field`;
  };

  const waitForConfirmation = async (txId: string): Promise<boolean> => {
    return new Promise(resolve => {
      const interval = setInterval(async () => {
        try {
          const res = await transactionStatus(txId);
          const status = res.status?.toLowerCase();

          if (status === 'accepted' || status === 'completed') {
            clearInterval(interval);
            resolve(true);
          }

          if (status === 'failed' || status === 'rejected') {
            clearInterval(interval);
            resolve(false);
          }
        } catch {
          clearInterval(interval);
          resolve(false);
        }
      }, 3000);
    });
  };

  const handleCreate = async () => {
    if (!connected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      const nonce = generateNonce();

      const tx = await executeTransaction({
        program: PROGRAM_ID,
        function: "create_credit_tier",
        inputs: [
          address,                  // r0 → address.private
          `${selectedTier}u8`,      // r1 → tier
          nonce                     // r2 → field
        ],
        fee: 150000,
        privateFee: false
      });

      if (!tx?.transactionId) {
        throw new Error("Transaction failed to submit");
      }

      const confirmed = await waitForConfirmation(tx.transactionId);

      if (!confirmed) {
        throw new Error("Transaction rejected on-chain");
      }

      setStep(3);
      toast.success("Credit tier created successfully!");

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || "Failed to create credit tier");
      setStep(1);
    } finally {
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
          borderRadius: 4
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center' }}>
        <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" fontWeight="bold">
          Create Credit Tier
        </Typography>
      </DialogTitle>

      <DialogContent>
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
                      <Box display="flex" alignItems="center" gap={1}>
                        <GradeIcon sx={{ color: tierInfo[t].color }} />
                        {tierInfo[t].name}
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
                sx={{ mt: 3 }}
              >
                {tierInfo[selectedTier].description}
              </Alert>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              <CircularProgress size={60} />
              <Typography mt={2}>
                Processing Private Proof...
              </Typography>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ textAlign: 'center', padding: '2rem' }}
            >
              <CheckIcon sx={{ fontSize: 80, color: 'success.main' }} />
              <Typography mt={2} color="success.main">
                Credit Tier Confirmed!
              </Typography>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {step === 1 && (
          <>
            <Button onClick={onClose} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              variant="contained"
              disabled={loading}
            >
              Initialize {tierInfo[selectedTier].name}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};