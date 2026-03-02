import React, { useState, useMemo, useRef } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import {
  Box,
  Typography,
  Button,
  Fab,
  Dialog,
  DialogContent,
  Chip,
  Stack,
  Alert,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  AssignmentTurnedIn as TierIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import VariableProximity from '../components/VariableProximity';
import { usePrivLend } from '../context/PrivLendContext';
import { StatsDashboard } from '../components/StatsDashboard';
import { LoanCard } from '../components/LoanCard';
import { CreditTierCreator } from '../components/CreditTierCreator';
import { LoanCreationForm } from '../components/LoanCreationForm';

export const Dashboard: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    userLoans,
    currentBlock,
    refreshData,
    loading
  } = usePrivLend();

  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  if (!connected) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background:
            'radial-gradient(circle at 30% 20%, #1e293b, #0f172a 60%)'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Paper
            sx={{
              p: 6,
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div
              ref={containerRef}
              style={{ position: 'relative', display: 'inline-block' }}
            >
              <VariableProximity
                label="Welcome to PrivLend"
                className="variable-proximity"
                fromFontVariationSettings="'wght' 400, 'opsz' 14"
                toFontVariationSettings="'wght' 1000, 'opsz' 60"
                containerRef={containerRef}
                radius={140}
                falloff="gaussian"
                style={{
                  fontSize: '4rem',
                  color: 'white'
                }}
              />
            </div>

            <Box mt={3}>
              <VariableProximity
                label="Private DeFi Lending on Aleo"
                className="variable-proximity"
                fromFontVariationSettings="'wght' 300, 'opsz' 12"
                toFontVariationSettings="'wght' 800, 'opsz' 36"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
                style={{
                  fontSize: '1.5rem',
                  color: '#94a3b8'
                }}
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              sx={{
                mt: 6,
                px: 5,
                py: 1.8,
                fontSize: '1rem',
                borderRadius: 3,
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 10px 30px rgba(99,102,241,0.4)'
              }}
              onClick={() => setVisible(true)}
              startIcon={<WalletIcon />}
            >
              Connect Wallet
            </Button>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  const activeLoans = useMemo(
    () => userLoans.filter(l => l.active),
    [userLoans]
  );

  const expiredLoans = useMemo(
    () =>
      userLoans.filter(
        l => l.active && currentBlock > l.deadline
      ),
    [userLoans, currentBlock]
  );

  const settledLoans = useMemo(
    () => userLoans.filter(l => !l.active),
    [userLoans]
  );

  const totalExposure = activeLoans.length;

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="white">
          My Portfolio
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Your private borrowing activity
        </Typography>
      </Box>

      {/* Network Stats */}
      <StatsDashboard />

      {/* Summary Chips */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Chip label={`Active: ${activeLoans.length}`} />
        <Chip label={`Expired: ${expiredLoans.length}`} color="error" />
        <Chip label={`Settled: ${settledLoans.length}`} />
        <Chip label={`Exposure: ${totalExposure}`} />
      </Stack>

      {expiredLoans.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          You have {expiredLoans.length} loan(s) eligible for liquidation.
        </Alert>
      )}

      {/* Loans */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="white" mb={3}>
          My Loans
        </Typography>

        {loading ? (
          <Box textAlign="center" py={6}>
            Loading...
          </Box>
        ) : userLoans.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: 4
            }}
          >
            <Typography color="text.secondary">
              No loans found.
            </Typography>

            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setLoanDialogOpen(true)}
            >
              Create Your First Loan
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns:
                'repeat(auto-fill, minmax(350px, 1fr))'
            }}
          >
            {userLoans.map(loan => (
              <LoanCard
                key={loan.loan_id}
                loan={loan}
                onUpdate={refreshData}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Floating Actions */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Fab
          variant="extended"
          color="secondary"
          onClick={() => setCreditDialogOpen(true)}
        >
          <TierIcon sx={{ mr: 1 }} />
          Create Credit Tier
        </Fab>

        <Fab
          variant="extended"
          color="primary"
          onClick={() => setLoanDialogOpen(true)}
        >
          <AddIcon sx={{ mr: 1 }} />
          New Loan
        </Fab>
      </Box>

      {/* Dialogs */}
      <CreditTierCreator
        open={creditDialogOpen}
        onClose={() => setCreditDialogOpen(false)}
        onSuccess={refreshData}
      />

      <Dialog
        open={loanDialogOpen}
        onClose={() => setLoanDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, bgcolor: '#0f172a' }}>
          <LoanCreationForm
            onSuccess={refreshData}
            onClose={() => setLoanDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};