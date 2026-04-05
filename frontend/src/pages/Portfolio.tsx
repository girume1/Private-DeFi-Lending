import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Grid,
  Chip,
  Avatar,
  Button,
  Divider,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  CircularProgress,
  TextField,
  Modal,
  Fade,
  Backdrop,
} from "@mui/material";
import {
  AccountCircle,
  OpenInNew,
  TrendingUp,
  Lock,
  CurrencyExchange,
  ContentCopy,
  Visibility,
  VisibilityOff,
  Grade,
  Edit,
  Save,
  Close,
  CameraAlt,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { AccountBalanceWallet as WalletIcon } from "@mui/icons-material";
import { usePrivLend } from "../context/PrivLendContext";
import { LoanCard } from "../components/LoanCard";
import toast from "react-hot-toast";

const EXPLORER = "https://testnet.explorer.provable.com/address/";

// ─── Balance Card ─────────────────────────────────────────────────────────────
const BalanceCard: React.FC<{
  label: string;
  value: string;
  unit: string;
  color: string;
  icon: React.ReactNode;
}> = ({ label, value, unit, color, icon }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 3,
      height: "100%",
      background: `linear-gradient(145deg, ${color}10, ${color}04)`,
      border: `1px solid ${color}25`,
      transition: "transform 0.2s, border-color 0.2s",
      "&:hover": { transform: "translateY(-2px)", borderColor: `${color}50` },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "0.68rem" }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ color, fontFamily: "monospace", mt: 0.5, letterSpacing: "-0.02em" }}
        >
          {value}
        </Typography>
        <Typography variant="body2" color="text.disabled">{unit}</Typography>
      </Box>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
        }}
      >
        {icon}
      </Box>
    </Stack>
  </Paper>
);

const LoanSummaryRow: React.FC<{ label: string; count: number; color: string }> = ({
  label,
  count,
  color,
}) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" py={1}>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Stack>
    <Typography variant="body2" fontWeight={700} sx={{ color }}>{count}</Typography>
  </Stack>
);

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
const EditProfileModal: React.FC<{
  open: boolean;
  onClose: () => void;
  username: string;
  avatar: string | null;
  onSave: (username: string, avatar: string | null) => void;
}> = ({ open, onClose, username: initUsername, avatar: initAvatar, onSave }) => {
  const [username, setUsername] = useState(initUsername);
  const [avatar, setAvatar] = useState<string | null>(initAvatar);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(initUsername);
    setAvatar(initAvatar);
  }, [initUsername, initAvatar, open]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    onSave(username.trim(), avatar);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { bgcolor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" } } }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 360,
            borderRadius: "20px",
            outline: "none",
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            border: "1px solid rgba(245,158,11,0.3)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            p: 4,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography fontWeight={700} color="white" fontSize="1.1rem">Edit Profile</Typography>
            <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
              <Close />
            </IconButton>
          </Stack>

          {/* Avatar editor */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Avatar
                src={avatar ?? undefined}
                sx={{
                  width: 90,
                  height: 90,
                  mx: "auto",
                  background: "linear-gradient(135deg,#F59E0B,#8b5cf6)",
                  fontSize: "1.6rem",
                  fontWeight: 800,
                  boxShadow: "0 8px 24px rgba(245,158,11,0.4)",
                }}
              >
                {!avatar && username.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box
                onClick={() => fileRef.current?.click()}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  bgcolor: "#F59E0B",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  "&:hover": { bgcolor: "#8b5cf6" },
                  transition: "background 0.15s",
                }}
              >
                <CameraAlt sx={{ fontSize: 16, color: "white" }} />
              </Box>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
            </Box>
            <Typography variant="caption" color="text.disabled" display="block" mt={1}>
              Click the camera to change photo
            </Typography>
          </Box>

          {/* Username */}
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            inputProps={{ maxLength: 30 }}
            sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          {avatar && (
            <Button size="small" onClick={() => setAvatar(null)} sx={{ mb: 2, color: "#ef4444", fontSize: "0.75rem" }}>
              Remove photo
            </Button>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{ borderRadius: 2, borderColor: "rgba(255,255,255,0.1)", color: "text.secondary" }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSave}
              startIcon={<Save />}
              sx={{ borderRadius: 2, background: "linear-gradient(135deg,#F59E0B,#8b5cf6)", fontWeight: 700 }}
            >
              Save
            </Button>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
};

// ─── Portfolio ────────────────────────────────────────────────────────────────
export const Portfolio: React.FC = () => {
  const { address, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    activeUserLoans,
    expiredUserLoans,
    settledUserLoans,
    activeLenderLoans,
    expiredLenderLoans,
    balances,
    refreshData,
    loading,
  } = usePrivLend();

  const [tab, setTab] = useState(0);
  const [showAddress, setShowAddress] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const aleoBalance = useMemo(
    () => (Number(balances.credits) / 1_000_000).toFixed(4),
    [balances.credits],
  );
  const totalBorrower = useMemo(
    () => activeUserLoans.length + expiredUserLoans.length + settledUserLoans.length,
    [activeUserLoans, expiredUserLoans, settledUserLoans],
  );
  const totalLender = useMemo(
    () => activeLenderLoans.length + expiredLenderLoans.length,
    [activeLenderLoans, expiredLenderLoans],
  );
  const totalCollateralLocked = useMemo(
    () => [...activeUserLoans, ...expiredUserLoans].filter((l) => l.collateral_locked).length,
    [activeUserLoans, expiredUserLoans],
  );
  const healthScore = useMemo(() => {
    if (totalBorrower === 0) return 100;
    return Math.max(0, Math.round(100 - (expiredUserLoans.length / totalBorrower) * 100));
  }, [totalBorrower, expiredUserLoans]);
  const healthColor =
    healthScore >= 80 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444";

  // Load profile from localStorage
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`profile_${address}`);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setUsername(p.username ?? `User_${address.slice(5, 11)}`);
        setAvatar(p.avatar ?? null);
      } catch {
        setUsername(`User_${address.slice(5, 11)}`);
      }
    } else {
      setUsername(`User_${address.slice(5, 11)}`);
      setAvatar(null);
    }
  }, [address]);

  const saveProfile = (newUsername: string, newAvatar: string | null) => {
    if (!address) return;
    setUsername(newUsername);
    setAvatar(newAvatar);
    localStorage.setItem(
      `profile_${address}`,
      JSON.stringify({ username: newUsername, avatar: newAvatar }),
    );
    toast.success("Profile updated!");
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!connected || !address) {
    return (
      <Box textAlign="center" py={10}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <AccountCircle sx={{ fontSize: 64, color: "rgba(245,158,11,0.4)", mb: 2 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>Your Portfolio</Typography>
          <Typography color="text.secondary" mb={4}>Connect your wallet to view your portfolio</Typography>
          <Button
            variant="contained"
            startIcon={<WalletIcon />}
            onClick={() => setVisible(true)}
            sx={{ borderRadius: 2, px: 4, background: "linear-gradient(135deg,#F59E0B,#8b5cf6)" }}
          >
            Connect Wallet
          </Button>
        </motion.div>
      </Box>
    );
  }

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" fontWeight={800} color="white" letterSpacing="-0.02em" mb={0.5}>
          Portfolio
        </Typography>
        <Typography color="text.secondary" mb={4}>
          Your complete private lending activity on Aleo Testnet
        </Typography>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            {/* Identity Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: "linear-gradient(145deg,#1e293b,#0f172a)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Box sx={{ position: "relative", flexShrink: 0 }}>
                    <Avatar
                      src={avatar ?? undefined}
                      onClick={() => setEditOpen(true)}
                      sx={{
                        width: 64,
                        height: 64,
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        background: "linear-gradient(135deg,#F59E0B,#8b5cf6)",
                        boxShadow: "0 0 20px rgba(245,158,11,0.4)",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    >
                      {!avatar && username.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box
                      sx={{
                        position: "absolute",
                        bottom: -2,
                        right: -2,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        bgcolor: "#F59E0B",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        pointerEvents: "none",
                      }}
                    >
                      <CameraAlt sx={{ fontSize: 12, color: "white" }} />
                    </Box>
                  </Box>

                  <Box flex={1} minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography fontWeight={700} color="white" noWrap>{username}</Typography>
                      <IconButton
                        size="small"
                        onClick={() => setEditOpen(true)}
                        sx={{ color: "rgba(255,255,255,0.3)", p: 0.3, "&:hover": { color: "#FCD34D" } }}
                      >
                        <Edit sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                    >
                      {showAddress ? address : `${address.slice(0, 10)}...${address.slice(-6)}`}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  <Button
                    size="small"
                    startIcon={showAddress ? <VisibilityOff /> : <Visibility />}
                    onClick={() => setShowAddress((p) => !p)}
                    sx={{ borderRadius: 1.5, color: "text.secondary", fontSize: "0.72rem", px: 1 }}
                  >
                    {showAddress ? "Hide" : "Show"}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<ContentCopy />}
                    onClick={copyAddress}
                    sx={{ borderRadius: 1.5, color: copied ? "#10b981" : "text.secondary", fontSize: "0.72rem", px: 1 }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<OpenInNew />}
                    href={`${EXPLORER}${address}`}
                    target="_blank"
                    component="a"
                    sx={{ borderRadius: 1.5, color: "text.secondary", fontSize: "0.72rem", px: 1 }}
                  >
                    Explorer
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => setEditOpen(true)}
                    sx={{ borderRadius: 1.5, color: "#FCD34D", fontSize: "0.72rem", px: 1 }}
                  >
                    Edit Profile
                  </Button>
                </Stack>
              </Paper>
            </motion.div>

            {/* Health Score */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: "linear-gradient(145deg,#1e293b,#0f172a)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography fontWeight={700} color="white">Portfolio Health</Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color: healthColor, fontFamily: "monospace" }}>
                    {healthScore}
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={healthScore}
                  sx={{
                    borderRadius: 4,
                    height: 8,
                    bgcolor: "rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: healthColor },
                  }}
                />
                <Typography variant="caption" color="text.disabled" mt={1} display="block">
                  {healthScore >= 80
                    ? "✅ Healthy — no expired loans"
                    : healthScore >= 50
                      ? "⚠️ Some loans at risk"
                      : "🚨 Liquidation risk detected"}
                </Typography>
              </Paper>
            </motion.div>

            {/* Loan Summary */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: "linear-gradient(145deg,#1e293b,#0f172a)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Typography fontWeight={700} color="white" mb={1}>Loan Summary</Typography>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 1.5 }} />
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  As Borrower
                </Typography>
                <LoanSummaryRow label="Active" count={activeUserLoans.length} color="#10b981" />
                <LoanSummaryRow label="Expired" count={expiredUserLoans.length} color="#ef4444" />
                <LoanSummaryRow label="Settled" count={settledUserLoans.length} color="#F59E0B" />
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 1.5 }} />
                <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  As Lender
                </Typography>
                <LoanSummaryRow label="Active" count={activeLenderLoans.length} color="#10b981" />
                <LoanSummaryRow label="Expired" count={expiredLenderLoans.length} color="#ef4444" />
                <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 1.5 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Total Collateral Locked</Typography>
                  <Typography variant="body2" fontWeight={700} color="#f59e0b">
                    {totalCollateralLocked} loan{totalCollateralLocked !== 1 ? "s" : ""}
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>

            {/* Credit Tier Info */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: "linear-gradient(145deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Grade sx={{ color: "#FBBF24" }} />
                  <Typography fontWeight={700} color="white">Credit Tier</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Credit tiers are private ZK records. They determine your interest rates when borrowing.
                </Typography>
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" gap={1}>
                  {[
                    { tier: "A", color: "#10b981", rate: "0–5%" },
                    { tier: "B", color: "#f59e0b", rate: "5–10%" },
                    { tier: "C", color: "#ef4444", rate: "10–20%" },
                  ].map((t) => (
                    <Chip
                      key={t.tier}
                      size="small"
                      label={`Tier ${t.tier} — ${t.rate}`}
                      sx={{ bgcolor: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30`, fontSize: "0.72rem" }}
                    />
                  ))}
                </Stack>
              </Paper>
            </motion.div>
          </Stack>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {/* Balances */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <BalanceCard
                    label="ALEO Balance"
                    value={aleoBalance}
                    unit="ALEO (from private records)"
                    color="#f59e0b"
                    icon={<CurrencyExchange />}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <BalanceCard
                    label="USDCx Balance"
                    value={balances.usdcx.toString()}
                    unit="USDCx (stablecoin)"
                    color="#F59E0B"
                    icon={<TrendingUp />}
                  />
                </Grid>
              </Grid>
            </motion.div>

            {/* Borrowed / Lent Tabs */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Paper
                sx={{
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "linear-gradient(145deg,#1e293b,#0f172a)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  sx={{
                    px: 2,
                    pt: 1,
                    "& .MuiTab-root": {
                      color: "text.secondary",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      textTransform: "none",
                      minWidth: "auto",
                      px: 2,
                    },
                    "& .Mui-selected": { color: "#FEF3C7" },
                    "& .MuiTabs-indicator": { bgcolor: "#F59E0B", borderRadius: 2 },
                  }}
                >
                  <Tab label={`Borrowed (${totalBorrower})`} />
                  <Tab label={`Lent (${totalLender})`} />
                </Tabs>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.05)" }} />

                <Box sx={{ p: 3, minHeight: 200 }}>
                  {loading ? (
                    <Box textAlign="center" py={6}>
                      <CircularProgress size={28} />
                    </Box>
                  ) : (
                    <>
                      {tab === 0 &&
                        (totalBorrower === 0 ? (
                          <Box textAlign="center" py={6}>
                            <Lock sx={{ fontSize: 40, color: "rgba(255,255,255,0.1)", mb: 2 }} />
                            <Typography color="text.secondary">No borrowed loans yet.</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                            {[...activeUserLoans, ...expiredUserLoans, ...settledUserLoans].map((loan) => (
                              <LoanCard key={loan.loan_id} loan={loan} onUpdate={refreshData} />
                            ))}
                          </Box>
                        ))}
                      {tab === 1 &&
                        (totalLender === 0 ? (
                          <Box textAlign="center" py={6}>
                            <TrendingUp sx={{ fontSize: 40, color: "rgba(255,255,255,0.1)", mb: 2 }} />
                            <Typography color="text.secondary">No lent loans yet.</Typography>
                          </Box>
                        ) : (
                          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                            {[...activeLenderLoans, ...expiredLenderLoans].map((loan) => (
                              <LoanCard key={loan.loan_id} loan={loan} onUpdate={refreshData} />
                            ))}
                          </Box>
                        ))}
                    </>
                  )}
                </Box>
              </Paper>
            </motion.div>
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        username={username}
        avatar={avatar}
        onSave={saveProfile}
      />
    </Box>
  );
};

export default Portfolio;
