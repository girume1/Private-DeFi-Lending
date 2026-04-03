import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Stack, Chip, Grid,
  CircularProgress, Dialog, DialogContent, Divider, LinearProgress,
  Tooltip, IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
  AssignmentTurnedIn as TierIcon,
  SwapHoriz as SwapIcon,
  TrendingUp, TrendingDown, Lock, CheckCircle,
  Warning, Timeline, Shield, CurrencyExchange,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import VariableProximity from '../components/VariableProximity';
import { usePrivLend } from '../context/PrivLendContext';
import { LoanCard } from '../components/LoanCard';
import { CreditTierCreator } from '../components/CreditTierCreator';
import { LoanCreationForm } from '../components/LoanCreationForm';
import { Swap } from '../components/Swap';

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string | number; sub?: string;
  color: string; icon: React.ReactNode; delay?: number;
}> = ({ label, value, sub, color, icon, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.35 }}
    style={{ height: '100%' }}
  >
    <Paper sx={{
      p: 2.5, height: '100%', borderRadius: 3,
      background: `linear-gradient(145deg, ${color}12, ${color}04)`,
      border: `1px solid ${color}28`,
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      '&:hover': { borderColor: `${color}55`, transform: 'translateY(-2px)' },
    }}>
      <Box sx={{
        position: 'absolute', top: -10, right: -10,
        width: 70, height: 70, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18, transparent 70%)`,
      }} />
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.3, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
            {value}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.disabled" mt={0.3} display="block">{sub}</Typography>
          )}
        </Box>
        <Box sx={{ color, opacity: 0.7, mt: 0.3 }}>{icon}</Box>
      </Stack>
    </Paper>
  </motion.div>
);

// ─── Activity Row ─────────────────────────────────────────────────────────────
const ActivityRow: React.FC<{ type: string; status: string; time: string; id: string; blockNumber?: number }> = ({ type, status, time, id, blockNumber }) => {
  const isGood = status === 'Completed';
  const color = isGood ? '#10b981' : status === 'Pending' ? '#f59e0b' : '#ef4444';
  return (
    <Stack
      component="a"
      href={`https://testnet.explorer.provable.com/transaction/${id}`}
      target="_blank" rel="noopener noreferrer"
      direction="row" alignItems="center" justifyContent="space-between"
      sx={{
        py: 1.2, px: 1.5, borderRadius: 2, textDecoration: 'none', cursor: 'pointer',
        '&:hover': { background: 'rgba(245,158,11,0.05)' },
        transition: 'background 0.15s',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
        <Box>
          <Typography variant="body2" fontWeight={500} color="white">{type}</Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
            {id.slice(0, 14)}…{blockNumber ? ` · #${blockNumber.toLocaleString()}` : ''}
          </Typography>
        </Box>
      </Stack>
      <Stack alignItems="flex-end" spacing={0.2}>
        <Chip label={status} size="small" sx={{
          height: 20, fontSize: '0.65rem', fontWeight: 600,
          bgcolor: `${color}20`, color, border: `1px solid ${color}40`,
        }} />
        <Typography variant="caption" color="text.disabled">{time}</Typography>
      </Stack>
    </Stack>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    activeUserLoans, expiredUserLoans, settledUserLoans,
    activeLenderLoans, expiredLenderLoans,
    allPublicLoans, balances, loading, refreshData,
    transactionHistory, currentBlock, stats,
  } = usePrivLend();

  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [loanDialogOpen, setLoanDialogOpen]     = useState(false);
  const [swapDialogOpen, setSwapDialogOpen]     = useState(false);
  const [tab, setTab] = useState<'borrower' | 'lender'>('borrower');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setLastUpdated(new Date());
    setRefreshing(false);
  }, [refreshData]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return 'Not refreshed yet';
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (diff < 60) return `Updated ${diff}s ago`;
    return `Updated ${Math.floor(diff / 60)}m ago`;
  }, [lastUpdated]);

  const aleoBalance = useMemo(() => (Number(balances.credits) / 1_000_000).toFixed(3), [balances.credits]);
  const totalBorrower = activeUserLoans.length + expiredUserLoans.length + settledUserLoans.length;
  const totalLender   = activeLenderLoans.length + expiredLenderLoans.length;

  const utilizationRate = useMemo(() => {
    if (allPublicLoans.length === 0) return 0;
    return Math.round((allPublicLoans.filter(l => l.active).length / allPublicLoans.length) * 100);
  }, [allPublicLoans]);

  const liquidationRisk = useMemo(() => {
    const active = allPublicLoans.filter(l => l.active);
    if (active.length === 0) return 0;
    return Math.round((active.filter(l => currentBlock > l.deadline).length / active.length) * 100);
  }, [allPublicLoans, currentBlock]);

  // ── Not connected ──────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <Box sx={{
        minHeight: '80vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
      }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Paper sx={{
            p: { xs: 4, md: 7 }, borderRadius: 5,
            background: 'rgba(15,23,42,0.8)',
            border: '1px solid rgba(245,158,11,0.2)',
            backdropFilter: 'blur(20px)',
            maxWidth: 540,
          }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '20px', mx: 'auto', mb: 3,
              background: 'linear-gradient(135deg,#F59E0B,#8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(245,158,11,0.35)',
            }}>
              <Shield sx={{ fontSize: 36, color: 'white' }} />
            </Box>

            <div ref={containerRef} style={{ display: 'inline-block' }}>
              <VariableProximity
                label="PrivLend"
                fromFontVariationSettings="'wght' 300"
                toFontVariationSettings="'wght' 900"
                containerRef={containerRef}
                radius={120}
                falloff="gaussian"
                style={{ fontSize: '2.8rem', color: 'white', letterSpacing: '-0.03em' }}
              />
            </div>

            <Typography color="text.secondary" mt={1.5} mb={1} fontSize="1rem">
              Private DeFi Lending on Aleo
            </Typography>

            <Stack direction="row" spacing={1} justifyContent="center" mb={4} flexWrap="wrap">
              {['ZK Proofs', 'Private Records', 'Shield Wallet'].map(t => (
                <Chip key={t} label={t} size="small" sx={{
                  bgcolor: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#FCD34D', fontSize: '0.72rem',
                }} />
              ))}
            </Stack>

            <Button
              variant="contained" size="large" fullWidth
              onClick={() => setVisible(true)}
              startIcon={<WalletIcon />}
              sx={{
                py: 1.5, borderRadius: 3, fontWeight: 700, fontSize: '1rem',
                background: 'linear-gradient(135deg,#F59E0B,#8b5cf6)',
                boxShadow: '0 8px 30px rgba(245,158,11,0.4)',
                '&:hover': { boxShadow: '0 8px 40px rgba(245,158,11,0.6)' },
              }}
            >
              Connect Wallet to Start
            </Button>
          </Paper>
        </motion.div>
      </Box>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="white" letterSpacing="-0.02em">
              Dashboard
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5} mt={0.3}>
              <Typography color="text.secondary" fontSize="0.875rem">
                Block <Box component="span" sx={{ color: '#8b5cf6', fontWeight: 700, fontFamily: 'monospace' }}>#{currentBlock.toLocaleString()}</Box> — Aleo Testnet
              </Typography>
              <Typography variant="caption" color="text.disabled">·</Typography>
              <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.72rem' }}>
                {lastUpdatedLabel}
              </Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh data" placement="bottom">
              <IconButton onClick={handleRefresh} disabled={refreshing} size="small"
                sx={{
                  color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 2, width: 34, height: 34,
                  '&:hover': { color: '#FCD34D', borderColor: 'rgba(245,158,11,0.4)', bgcolor: 'rgba(245,158,11,0.08)' },
                }}>
                <motion.div animate={{ rotate: refreshing ? 360 : 0 }}
                  transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
                  <RefreshIcon sx={{ fontSize: 16 }} />
                </motion.div>
              </IconButton>
            </Tooltip>
            <Button variant="outlined" size="small" startIcon={<SwapIcon />}
              onClick={() => setSwapDialogOpen(true)}
              sx={{ borderRadius: 2, borderColor: 'rgba(245,158,11,0.4)', color: '#FCD34D',
                '&:hover': { borderColor: '#F59E0B', bgcolor: 'rgba(245,158,11,0.08)' } }}>
              Swap
            </Button>
            <Button variant="outlined" size="small" startIcon={<TierIcon />}
              onClick={() => setCreditDialogOpen(true)}
              sx={{ borderRadius: 2, borderColor: 'rgba(16,185,129,0.4)', color: '#6ee7b7',
                '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.08)' } }}>
              Credit Tier
            </Button>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setLoanDialogOpen(true)}
              sx={{ borderRadius: 2, background: 'linear-gradient(135deg,#F59E0B,#8b5cf6)',
                boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
              New Loan
            </Button>
          </Stack>
        </Stack>
      </motion.div>

      {/* Stat Cards Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'ALEO Balance',    value: `${aleoBalance}`,         sub: 'ALEO',          color: '#f59e0b', icon: <CurrencyExchange />, delay: 0 },
          { label: 'USDCx Balance',   value: balances.usdcx.toString(), sub: 'USDCx',         color: '#F59E0B', icon: <TrendingUp />,       delay: 0.05 },
          { label: 'Active Loans',    value: stats.activeLoans,         sub: 'protocol-wide', color: '#10b981', icon: <Lock />,             delay: 0.1 },
          { label: 'Utilization',     value: `${utilizationRate}%`,     sub: 'of all loans',  color: '#8b5cf6', icon: <Timeline />,         delay: 0.15 },
          { label: 'Liq. Risk',       value: `${liquidationRisk}%`,     sub: 'expired loans', color: '#ef4444', icon: <Warning />,          delay: 0.2 },
          { label: 'Total Loans',     value: stats.totalLoans,          sub: 'ever created',  color: '#06b6d4', icon: <Shield />,           delay: 0.25 },
        ].map((s) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>

        {/* Left — My Loans */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{
            borderRadius: 4, overflow: 'hidden',
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Tab Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 2 }}>
              <Typography fontWeight={700} color="white">My Loans</Typography>
              <Stack direction="row" spacing={0.5}>
                {(['borrower', 'lender'] as const).map(t => (
                  <Button key={t} size="small" onClick={() => setTab(t)}
                    sx={{
                      borderRadius: 2, px: 2, py: 0.5, fontSize: '0.78rem',
                      fontWeight: tab === t ? 700 : 400,
                      color: tab === t ? 'white' : 'text.secondary',
                      bgcolor: tab === t ? 'rgba(245,158,11,0.2)' : 'transparent',
                      border: tab === t ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                    }}>
                    {t === 'borrower' ? `Borrower (${totalBorrower})` : `Lender (${totalLender})`}
                  </Button>
                ))}
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* Loan List */}
            <Box sx={{ p: 3 }}>
              {loading ? (
                <Box textAlign="center" py={6}><CircularProgress size={32} /></Box>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {tab === 'borrower' && totalBorrower === 0 && (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Lock sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                        <Typography color="text.secondary">No loans yet.</Typography>
                        <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => setLoanDialogOpen(true)}>
                          Create First Loan
                        </Button>
                      </Box>
                    )}
                    {tab === 'lender' && totalLender === 0 && (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <TrendingUp sx={{ fontSize: 40, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                        <Typography color="text.secondary">No lent loans yet.</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                      {(tab === 'borrower'
                        ? [...activeUserLoans, ...expiredUserLoans, ...settledUserLoans]
                        : [...activeLenderLoans, ...expiredLenderLoans]
                      ).map(loan => (
                        <LoanCard key={loan.loan_id} loan={loan} onUpdate={refreshData} />
                      ))}
                    </Box>
                  </motion.div>
                </AnimatePresence>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right — Activity + Protocol Health */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>

            {/* Protocol Health */}
            <Paper sx={{
              p: 3, borderRadius: 4,
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Typography fontWeight={700} color="white" mb={2.5}>Protocol Health</Typography>
              <Stack spacing={2}>
                {[
                  { label: 'Utilization Rate', value: utilizationRate, color: '#10b981' },
                  { label: 'Liquidation Risk', value: liquidationRisk, color: '#ef4444' },
                  { label: 'Active / Total', value: stats.totalLoans > 0 ? Math.round((stats.activeLoans / Math.max(stats.totalLoans, 1)) * 100) : 0, color: '#F59E0B' },
                ].map(({ label, value, color }) => (
                  <Box key={label}>
                    <Stack direction="row" justifyContent="space-between" mb={0.8}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color }}>{value}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate" value={Math.min(value, 100)}
                      sx={{
                        borderRadius: 4, height: 6, bgcolor: 'rgba(255,255,255,0.06)',
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: color },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Recent Activity */}
            <Paper sx={{
              borderRadius: 4, overflow: 'hidden',
              background: 'linear-gradient(145deg, #1e293b, #0f172a)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Typography fontWeight={700} color="white">Recent Activity</Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              <Box sx={{ px: 1, py: 1.5, maxHeight: 280, overflowY: 'auto' }}>
                {transactionHistory.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.disabled">No transactions yet</Typography>
                  </Box>
                ) : (
                  transactionHistory.slice(0, 8).map(tx => (
                    <ActivityRow
                      key={tx.id}
                      type={tx.type}
                      status={tx.status}
                      time={tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : '—'}
                      id={tx.id}
                      blockNumber={tx.blockNumber}
                    />
                  ))
                )}
              </Box>
            </Paper>

          </Stack>
        </Grid>
      </Grid>

      {/* Dialogs */}
      <CreditTierCreator open={creditDialogOpen} onClose={() => setCreditDialogOpen(false)} onSuccess={refreshData} />

      <Dialog open={loanDialogOpen} onClose={() => setLoanDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: '#0F172A' }}>
          <LoanCreationForm onSuccess={refreshData} onClose={() => setLoanDialogOpen(false)}
            onOpenCreditTier={() => { setLoanDialogOpen(false); setCreditDialogOpen(true); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: '#0F172A' }}>
          <Swap onSuccess={() => { refreshData(); setSwapDialogOpen(false); }} onClose={() => setSwapDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
