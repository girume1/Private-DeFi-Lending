import React from 'react';
import { Box, Typography, Paper, Container, Divider } from '@mui/material';
import {Grid} from '@mui/material';
import { 
  Lock, VisibilityOff, ReceiptLong, AccountBalanceWallet,
  Code
} from '@mui/icons-material';

const steps = [
  {
    title: "1. Private Credit Tier",
    desc: "Generate a ZK-proof of your creditworthiness. This creates a private record on Aleo that only you control.",
    icon: <VisibilityOff sx={{ fontSize: 40, color: '#818cf8' }} />
  },
  {
    title: "2. Encrypted Collateral",
    desc: "Lock assets into a private record. The amount is hidden from the public, but cryptographically verified by the protocol.",
    icon: <Lock sx={{ fontSize: 40, color: '#818cf8' }} />
  },
  {
    title: "3. On-Chain Status",
    desc: "A public mapping tracks the loan ID and deadline to ensure trustless enforcement without revealing sensitive data.",
    icon: <ReceiptLong sx={{ fontSize: 40, color: '#818cf8' }} />
  },
  {
    title: "4. Trustless Release",
    desc: "Upon full repayment, the smart contract automatically releases the collateral record back to your wallet.",
    icon: <AccountBalanceWallet sx={{ fontSize: 40, color: '#818cf8' }} />
  }
];

export const Docs: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Overview Section */}
      <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
        How PrivLend Works
      </Typography>
      <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 6 }}>
        Leveraging Aleo's Zero-Knowledge technology for private lending.
      </Typography>

      <Grid container spacing={4}>
        {steps.map((step, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Paper sx={{ 
              p: 4, 
              background: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.05)', 
              borderRadius: 4,
              height: '100%'
            }}>
              <Box sx={{ mb: 2 }}>{step.icon}</Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                {step.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                {step.desc}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Technical Schema Section */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Code sx={{ color: '#818cf8', fontSize: 32 }} />
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          Protocol Schema
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Loan Record */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, background: '#020617', border: '1px solid #1e293b', borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#818cf8', mb: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
              record Loan
            </Typography>
            <Box sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 2 }}>
              <div style={{ paddingLeft: '10px' }}>owner: address <span style={{color: '#475569'}}>// Borrower</span></div>
              <div style={{ paddingLeft: '10px' }}>lender: address</div>
              <div style={{ paddingLeft: '10px' }}>principal: u64 <span style={{color: '#10b981'}}>// Private</span></div>
              <div style={{ paddingLeft: '10px' }}>collateral: u64 <span style={{color: '#10b981'}}>// Private</span></div>
              <div style={{ paddingLeft: '10px' }}>repaid: u64</div>
              <div style={{ paddingLeft: '10px' }}>status: u8 <span style={{color: '#475569'}}>// 0=Active, 2=Repaid</span></div>
            </Box>
          </Paper>
        </Grid>

        {/* Collateral Record */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, background: '#020617', border: '1px solid #1e293b', borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ color: '#818cf8', mb: 2, fontFamily: 'monospace', fontWeight: 'bold' }}>
              record Collateral
            </Typography>
            <Box sx={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 2 }}>
              <div style={{ paddingLeft: '10px' }}>owner: address</div>
              <div style={{ paddingLeft: '10px' }}>loan_id: u32</div>
              <div style={{ paddingLeft: '10px' }}>amount: u64 <span style={{color: '#10b981'}}>// Private</span></div>
              <div style={{ paddingLeft: '10px' }}>locked_until: u32 <span style={{color: '#475569'}}>// Block Height</span></div>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};