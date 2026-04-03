import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, Stack } from '@mui/material';
import { SwapHoriz as SwapIcon, TrendingUp, Info } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Swap } from '../components/Swap';
import { usePrivLend } from '../context/PrivLendContext';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { Button } from '@mui/material';
import { AccountBalanceWallet as WalletIcon } from '@mui/icons-material';

const StatPill: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <Box
    sx={{
      px: 3, py: 2,
      borderRadius: 3,
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      border: `1px solid ${color}30`,
      flex: 1,
      minWidth: 140,
    }}
  >
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="h6" fontWeight={700} sx={{ color, fontFamily: 'monospace', mt: 0.3 }}>
      {value}
    </Typography>
  </Box>
);

export const SwapPage: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { balances, refreshData, currentBlock } = usePrivLend();
  const [swapped, setSwapped] = useState(false);

  const aleoBalance = (Number(balances.credits) / 1_000_000).toFixed(4);
  const usdcxBalance = balances.usdcx.toString();

  if (!connected) {
    return (
      <Box textAlign="center" py={10}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <SwapIcon sx={{ fontSize: 64, color: '#6366f1', mb: 2, opacity: 0.7 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Swap Tokens</Typography>
          <Typography color="text.secondary" mb={4}>
            Connect your wallet to swap between ALEO and USDCx
          </Typography>
          <Button
            variant="contained"
            startIcon={<WalletIcon />}
            onClick={() => setVisible(true)}
            sx={{ borderRadius: 2, px: 4, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            Connect Wallet
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} color="white" letterSpacing="-0.02em">
            Token Swap
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            Instantly swap between ALEO microcredits and USDCx at 1:1 rate
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4, flexWrap: 'wrap' }}>
          <StatPill label="Your ALEO" value={`${aleoBalance} ALEO`} color="#f59e0b" />
          <StatPill label="Your USDCx" value={`${usdcxBalance} USDCx`} color="#6366f1" />
          <StatPill label="Swap Rate" value="1:1 (testnet)" color="#10b981" />
          <StatPill label="Current Block" value={`#${currentBlock.toLocaleString()}`} color="#8b5cf6" />
        </Stack>
      </motion.div>

      {/* Main Layout */}
      <Grid container spacing={4}>
        {/* Swap Widget */}
        <Grid size={{ xs: 12, md: 7 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Swap
              onSuccess={() => { setSwapped(true); refreshData(); }}
              onClose={() => {}}
            />
          </motion.div>
        </Grid>

        {/* Info Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Stack spacing={3}>

              {swapped && (
                <Paper sx={{
                  p: 3, borderRadius: 3,
                  background: 'linear-gradient(135deg, #10b98118, #10b98108)',
                  border: '1px solid #10b98140'
                }}>
                  <Typography color="#10b981" fontWeight={700}>✅ Swap Successful!</Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Your balances have been updated.
                  </Typography>
                </Paper>
              )}

              {/* How it works */}
              <Paper sx={{
                p: 3, borderRadius: 3,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Info sx={{ color: '#6366f1', fontSize: 20 }} />
                  <Typography fontWeight={700} color="white">How Swapping Works</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {[
                    { step: '1', text: 'Choose direction — Credits → USDCx or vice versa' },
                    { step: '2', text: 'Enter amount to swap' },
                    { step: '3', text: 'Set slippage tolerance (default 0.5%)' },
                    { step: '4', text: 'Confirm in Shield Wallet — atomic on-chain swap' },
                  ].map(({ step, text }) => (
                    <Stack key={step} direction="row" spacing={1.5} alignItems="flex-start">
                      <Box sx={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'white' }}>{step}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">{text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Why swap */}
              <Paper sx={{
                p: 3, borderRadius: 3,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <TrendingUp sx={{ color: '#10b981', fontSize: 20 }} />
                  <Typography fontWeight={700} color="white">Why Swap?</Typography>
                </Stack>
                <Stack spacing={1}>
                  {[
                    'Need USDCx to lend to borrowers? Swap from ALEO.',
                    'Received USDCx repayment? Swap back to ALEO.',
                    'All swaps are atomic ZK transactions on Aleo testnet.',
                  ].map((t, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      • {t}
                    </Typography>
                  ))}
                </Stack>
              </Paper>

              <Paper sx={{
                p: 2.5, borderRadius: 3,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.2)'
              }}>
                <Typography variant="caption" color="#f59e0b" fontWeight={600}>
                  ⚠️ Testnet Only
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  This swap uses test tokens. The 1:1 rate is for testnet demonstration purposes only.
                </Typography>
              </Paper>

            </Stack>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SwapPage;
