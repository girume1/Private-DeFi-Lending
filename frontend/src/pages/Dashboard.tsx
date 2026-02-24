import React, { useState } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { 
  Box, 
  Typography, 
  Button,
  Fab,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  AssignmentTurnedIn as TierIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { usePrivLend } from '../context/PrivLendContext';
import { StatsDashboard } from '../components/StatsDashboard';
import { LoanCard } from '../components/LoanCard';
import { CreditTierCreator } from '../components/CreditTierCreator';
import { LoanCreationForm } from '../components/LoanCreationForm';

export const Dashboard: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal(); // Hook for the connection popup
  const { userLoans, refreshData } = usePrivLend();
  
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen] = useState(false);

  if (!connected) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
            Welcome to PrivLend
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Private DeFi Lending on Aleo with Zero-Knowledge Proofs
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => setVisible(true)}
            startIcon={<WalletIcon />}
            sx={{ px: 4, py: 1.5, borderRadius: 3, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            Connect Wallet to Start
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>My Portfolio</Typography>
        <Typography variant="body1" color="text.secondary">Overview of your private positions and network status.</Typography>
      </Box>

      <StatsDashboard />

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: 'white' }}>Active Loans</Typography>
        
        {userLoans.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'rgba(30, 41, 59, 0.3)', borderRadius: 4, border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No active loans found.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setLoanDialogOpen(true)}
              sx={{ mt: 2 }}
            >
              Create Your First Loan
            </Button>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gap: 3, 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' 
          }}>
            {userLoans.map(loan => (
              <LoanCard key={loan.loan_id} loan={loan} onUpdate={refreshData} />
            ))}
          </Box>
        )}
      </Box>

      {/* Modern Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
          New Loan Request
        </Fab>
      </Box>

      <CreditTierCreator
        open={creditDialogOpen}
        onClose={() => setCreditDialogOpen(false)}
        onSuccess={refreshData}
      />

      <Dialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: '#0f172a' }}>
          <LoanCreationForm 
            onSuccess={() => {
              refreshData();
              setLoanDialogOpen(false);
            }} 
            onClose={() => setLoanDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};