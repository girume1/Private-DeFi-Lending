import React, { useState, useMemo } from "react";
import {
  Box, Typography, Paper, Grid, Button, Stack, Chip, Divider,
  Dialog, DialogContent, TextField, InputAdornment, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, CircularProgress, LinearProgress, Tabs, Tab
} from "@mui/material";
import {
  Add as AddIcon,
  AssignmentTurnedIn as TierIcon,
  AccountBalanceWallet as WalletIcon,
  Calculate as CalcIcon,
  CheckCircle, RadioButtonUnchecked,
  Grade, TrendingUp, Lock, Payment,
  ArrowForward, Info, Warning
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { LoanCreationForm } from "../components/LoanCreationForm";
import { CreditTierCreator } from "../components/CreditTierCreator";
import { LoanCard } from "../components/LoanCard";
import { usePrivLend } from "../context/PrivLendContext";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";

// ─── Step Guide ───────────────────────────────────────────────────────────────
const HOW_TO_STEPS = [
  {
    icon: <WalletIcon />,
    title: "Connect Shield Wallet",
    desc: "Connect your Shield Wallet to access private record management and ZK proof generation.",
    color: "#F59E0B",
  },
  {
    icon: <TierIcon />,
    title: "Create Credit Tier",
    desc: "Generate a private ZK credit tier record (A, B, or C). This proves your creditworthiness without revealing your identity.",
    color: "#8b5cf6",
  },
  {
    icon: <AddIcon />,
    title: "Open a Loan",
    desc: "Set your loan terms — principal (USDCx), collateral (ALEO), interest rate, and duration. The loan is created atomically on-chain.",
    color: "#10b981",
  },
  {
    icon: <Payment />,
    title: "Repay & Reclaim",
    desc: "Repay principal + interest in USDCx. Your locked ALEO collateral is released back to you automatically.",
    color: "#f59e0b",
  },
];

// ─── Tier Table ───────────────────────────────────────────────────────────────
const TIER_DATA = [
  { tier: "A", label: "Elite",    color: "#10b981", minRate: 2,  maxRate: 5,  ltv: "Up to 80%", risk: "Low",    desc: "Best rates for top borrowers" },
  { tier: "B", label: "Standard", color: "#f59e0b", minRate: 5,  maxRate: 10, ltv: "Up to 70%", risk: "Medium", desc: "Balanced risk/reward" },
  { tier: "C", label: "Starter",  color: "#ef4444", minRate: 10, maxRate: 20, ltv: "Up to 60%", risk: "High",   desc: "Higher rates, build history" },
];

// ─── Collateral Calculator ────────────────────────────────────────────────────
const CollateralCalculator: React.FC = () => {
  const [principal, setPrincipal] = useState(1000);
  const [interestBps, setInterestBps] = useState(500);
  const [durationDays, setDurationDays] = useState(30);

  const minCollateral = Math.ceil(principal * 1.5);
  const interest = (principal * interestBps) / 10000;
  const totalRepay = principal + interest;
  const ltv = principal > 0 ? ((principal / minCollateral) * 100).toFixed(1) : "0";
  const durationBlocks = durationDays * 144;

  return (
    <Paper sx={{
      p: 3, borderRadius: 4,
      background: "linear-gradient(145deg, #1e293b, #0f172a)",
      border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Box sx={{ width: 36, height: 36, borderRadius: "10px", background: "rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CalcIcon sx={{ color: "#FBBF24", fontSize: 20 }} />
        </Box>
        <Typography fontWeight={700} color="white">Collateral Calculator</Typography>
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" type="number" label="Principal (USDCx)"
            value={principal}
            onChange={e => setPrincipal(Math.max(0, Number(e.target.value)))}
            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">USDCx</Typography></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" type="number" label="Interest Rate (bps)"
            value={interestBps}
            onChange={e => setInterestBps(Math.min(2000, Math.max(0, Number(e.target.value))))}
            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">{(interestBps / 100).toFixed(1)}%</Typography></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth size="small" type="number" label="Duration (days)"
            value={durationDays}
            onChange={e => setDurationDays(Math.max(10, Number(e.target.value)))}
            InputProps={{ endAdornment: <InputAdornment position="end"><Typography variant="caption" color="text.secondary">~{durationBlocks.toLocaleString()} blocks</Typography></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <Typography variant="caption" color="text.secondary">Min Collateral Required</Typography>
            <Typography fontWeight={700} color="#f59e0b" sx={{ fontFamily: "monospace" }}>
              {minCollateral.toLocaleString()} µALEO
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2.5 }} />

      <Grid container spacing={1.5}>
        {[
          { label: "Principal",         value: `${principal.toLocaleString()} USDCx`,         color: "#F59E0B" },
          { label: "Interest",          value: `${interest.toFixed(2)} USDCx`,                color: "#8b5cf6" },
          { label: "Total Repayment",   value: `${totalRepay.toFixed(2)} USDCx`,              color: "#10b981" },
          { label: "Collateral (min)",  value: `${minCollateral.toLocaleString()} µALEO`,     color: "#f59e0b" },
          { label: "LTV Ratio",         value: `${ltv}%`,                                     color: "#06b6d4" },
          { label: "Duration",          value: `~${durationDays} days`,                       color: "#a78bfa" },
        ].map(({ label, value, color }) => (
          <Grid size={{ xs: 6 }} key={label}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}0c`, border: `1px solid ${color}20` }}>
              <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color, fontFamily: "monospace" }}>{value}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2, "& .MuiAlert-icon": { alignItems: "center" } }}>
        <Typography variant="caption">
          Collateral ratio is fixed at <strong>150%</strong> minimum. If you don't repay before the deadline, your lender can liquidate your collateral.
        </Typography>
      </Alert>
    </Paper>
  );
};

// ─── Borrow Page ──────────────────────────────────────────────────────────────
export const Borrow: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    activeUserLoans, expiredUserLoans, settledUserLoans,
    balances, refreshData, loading, currentBlock,
  } = usePrivLend();

  const [showTierModal, setShowTierModal]   = useState(false);
  const [showLoanModal, setShowLoanModal]   = useState(false);
  const [tab, setTab]                       = useState(0);

  const totalLoans = activeUserLoans.length + expiredUserLoans.length + settledUserLoans.length;
  const aleoBalance = (Number(balances.credits) / 1_000_000).toFixed(3);

  const displayLoans = useMemo(() => {
    if (tab === 0) return [...activeUserLoans, ...expiredUserLoans];
    if (tab === 1) return settledUserLoans;
    return [...activeUserLoans, ...expiredUserLoans, ...settledUserLoans];
  }, [tab, activeUserLoans, expiredUserLoans, settledUserLoans]);

  // ── Not connected ────────────────────────────────────────────────────────
  if (!connected) {
    return (
      <Box textAlign="center" py={10}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <Lock sx={{ fontSize: 64, color: "rgba(245,158,11,0.4)", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Borrow Capital</Typography>
          <Typography color="text.secondary" mb={4}>
            Connect your Shield Wallet to access private ZK lending
          </Typography>
          <Button variant="contained" startIcon={<WalletIcon />} onClick={() => setVisible(true)}
            sx={{ borderRadius: 2, px: 4, py: 1.2, background: "linear-gradient(135deg,#F59E0B,#8b5cf6)", fontWeight: 700 }}>
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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} mb={4} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="white" letterSpacing="-0.02em">
              Borrow Capital
            </Typography>
            <Typography color="text.secondary" mt={0.3}>
              Private ZK lending — your identity stays confidential
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<TierIcon />} onClick={() => setShowTierModal(true)}
              sx={{ borderRadius: 2, borderColor: "rgba(16,185,129,0.4)", color: "#6ee7b7", fontWeight: 600,
                "&:hover": { borderColor: "#10b981", bgcolor: "rgba(16,185,129,0.08)" } }}>
              Credit Tier
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowLoanModal(true)}
              sx={{ borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg,#F59E0B,#8b5cf6)",
                boxShadow: "0 4px 15px rgba(245,158,11,0.3)" }}>
              New Loan
            </Button>
          </Stack>
        </Stack>
      </motion.div>

      {/* Balance Bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, background: "linear-gradient(145deg,#1e293b,#0f172a)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Grid container spacing={2} alignItems="center">
            {[
              { label: "ALEO Balance",   value: `${aleoBalance} ALEO`,              color: "#f59e0b" },
              { label: "USDCx Balance",  value: `${balances.usdcx.toString()} USDCx`, color: "#F59E0B" },
              { label: "Active Loans",   value: activeUserLoans.length,              color: "#10b981" },
              { label: "Expired Loans",  value: expiredUserLoans.length,             color: "#ef4444" },
              { label: "Current Block",  value: `#${currentBlock.toLocaleString()}`, color: "#8b5cf6" },
            ].map(({ label, value, color }) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={label}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.08em" }}>{label}</Typography>
                  <Typography fontWeight={700} sx={{ color, fontFamily: "monospace", fontSize: "0.95rem" }}>{value}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </motion.div>

      {/* Expired warning */}
      <AnimatePresence>
        {expiredUserLoans.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }} icon={<Warning />}>
              You have <strong>{expiredUserLoans.length}</strong> expired loan(s) at risk of liquidation. Repay as soon as possible.
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Grid container spacing={3}>

        {/* ── LEFT: How to Borrow + Tier Table ── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>

            {/* How to Borrow */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Paper sx={{ p: 3, borderRadius: 4, background: "linear-gradient(145deg,#1e293b,#0f172a)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Typography fontWeight={700} color="white" mb={2.5}>How to Borrow</Typography>
                <Stack spacing={0}>
                  {HOW_TO_STEPS.map((step, i) => (
                    <Box key={i}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" py={1.5}>
                        <Box sx={{
                          width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                          background: `${step.color}18`, border: `1px solid ${step.color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: step.color,
                        }}>
                          {step.icon}
                        </Box>
                        <Box flex={1}>
                          <Stack direction="row" alignItems="center" spacing={1} mb={0.3}>
                            <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: `${step.color}20`, border: `1px solid ${step.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, color: step.color }}>{i + 1}</Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="white">{step.title}</Typography>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" lineHeight={1.5}>{step.desc}</Typography>
                        </Box>
                      </Stack>
                      {i < HOW_TO_STEPS.length - 1 && (
                        <Box sx={{ ml: "19px", width: 2, height: 12, bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }} />
                      )}
                    </Box>
                  ))}
                </Stack>
                <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={() => setShowLoanModal(true)}
                  sx={{ mt: 2.5, borderRadius: 2, fontWeight: 700, background: "linear-gradient(135deg,#F59E0B,#8b5cf6)" }}>
                  Start Borrowing
                </Button>
              </Paper>
            </motion.div>

            {/* Interest Rate by Tier */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Paper sx={{ p: 3, borderRadius: 4, background: "linear-gradient(145deg,#1e293b,#0f172a)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
                  <Grade sx={{ color: "#FBBF24" }} />
                  <Typography fontWeight={700} color="white">Interest Rates by Tier</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {TIER_DATA.map((t) => (
                    <Box key={t.tier} sx={{
                      p: 2, borderRadius: 2.5,
                      background: `${t.color}0a`, border: `1px solid ${t.color}25`,
                      transition: "border-color 0.2s", "&:hover": { borderColor: `${t.color}50` },
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: "8px",
                            background: `${t.color}20`, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <Typography fontWeight={800} sx={{ color: t.color, fontSize: "0.85rem" }}>{t.tier}</Typography>
                          </Box>
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={700} color="white">Tier {t.tier}</Typography>
                              <Chip label={t.label} size="small" sx={{ height: 18, fontSize: "0.62rem", bgcolor: `${t.color}20`, color: t.color }} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">{t.desc}</Typography>
                          </Box>
                        </Stack>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight={700} sx={{ color: t.color, fontFamily: "monospace" }}>
                            {t.minRate}–{t.maxRate}%
                          </Typography>
                          <Typography variant="caption" color="text.disabled">APR</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={2} mt={1.5}>
                        <Box sx={{ flex: 1, p: 1, borderRadius: 1.5, bgcolor: "rgba(0,0,0,0.2)" }}>
                          <Typography variant="caption" color="text.disabled">Max LTV</Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ color: t.color }}>{t.ltv}</Typography>
                        </Box>
                        <Box sx={{ flex: 1, p: 1, borderRadius: 1.5, bgcolor: "rgba(0,0,0,0.2)" }}>
                          <Typography variant="caption" color="text.disabled">Risk</Typography>
                          <Typography variant="body2" fontWeight={600} sx={{ color: t.color }}>{t.risk}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Button fullWidth variant="outlined" startIcon={<TierIcon />} onClick={() => setShowTierModal(true)}
                  sx={{ mt: 2, borderRadius: 2, borderColor: "rgba(16,185,129,0.4)", color: "#6ee7b7",
                    "&:hover": { borderColor: "#10b981", bgcolor: "rgba(16,185,129,0.08)" } }}>
                  Create My Credit Tier
                </Button>
              </Paper>
            </motion.div>

            {/* Calculator */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <CollateralCalculator />
            </motion.div>

          </Stack>
        </Grid>

        {/* ── RIGHT: My Loans ── */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Paper sx={{
              borderRadius: 4, overflow: "hidden",
              background: "linear-gradient(145deg,#1e293b,#0f172a)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 3, pb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Typography fontWeight={700} color="white">My Loans</Typography>
                  <Chip label={totalLoans} size="small" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "rgba(245,158,11,0.2)", color: "#FCD34D" }} />
                </Stack>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setShowLoanModal(true)}
                  sx={{ borderRadius: 2, fontSize: "0.78rem", background: "linear-gradient(135deg,#F59E0B,#8b5cf6)" }}>
                  New Loan
                </Button>
              </Stack>

              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{
                px: 2,
                "& .MuiTab-root": { color: "text.secondary", fontWeight: 600, fontSize: "0.8rem", textTransform: "none", minWidth: "auto", px: 2 },
                "& .Mui-selected": { color: "#FEF3C7" },
                "& .MuiTabs-indicator": { bgcolor: "#F59E0B", borderRadius: 2 },
              }}>
                <Tab label={`Active & Expired (${activeUserLoans.length + expiredUserLoans.length})`} />
                <Tab label={`Settled (${settledUserLoans.length})`} />
                <Tab label={`All (${totalLoans})`} />
              </Tabs>

              <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

              <Box sx={{ p: 3 }}>
                {loading ? (
                  <Box textAlign="center" py={6}><CircularProgress size={28} /></Box>
                ) : displayLoans.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Lock sx={{ fontSize: 48, color: "rgba(255,255,255,0.08)", mb: 2 }} />
                    <Typography color="text.secondary" mb={1}>No loans in this category.</Typography>
                    <Typography variant="caption" color="text.disabled" display="block" mb={3}>
                      Create your first loan to start borrowing privately.
                    </Typography>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowLoanModal(true)}
                      sx={{ borderRadius: 2, borderColor: "rgba(245,158,11,0.4)", color: "#FCD34D" }}>
                      Create First Loan
                    </Button>
                  </Box>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
                        {displayLoans.map(loan => (
                          <LoanCard key={loan.loan_id} loan={loan} onUpdate={refreshData} />
                        ))}
                      </Box>
                    </motion.div>
                  </AnimatePresence>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Grid>

      </Grid>

      {/* Modals */}
      <CreditTierCreator open={showTierModal} onClose={() => setShowTierModal(false)} onSuccess={refreshData} />

      <Dialog open={showLoanModal} onClose={() => setShowLoanModal(false)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 0, bgcolor: "#0F172A" }}>
          <LoanCreationForm
            onSuccess={refreshData}
            onClose={() => setShowLoanModal(false)}
            onOpenCreditTier={() => { setShowLoanModal(false); setShowTierModal(true); }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
