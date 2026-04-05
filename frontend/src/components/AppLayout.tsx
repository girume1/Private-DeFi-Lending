import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
  Avatar,
  Modal,
  Fade,
  Backdrop,
  Stack,
  Divider,
} from "@mui/material";
import {
  Shield,
  Menu as MenuIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  MonetizationOn as BorrowIcon,
  Language as MarketsIcon,
  HelpOutline as DocsIcon,
  SwapHoriz as SwapIcon,
  PieChart as PortfolioIcon,
  ContentCopy,
  LogoutOutlined,
  OpenInNew,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { usePrivLend } from "../context/PrivLendContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon sx={{ fontSize: 16 }} />,
  },
  {
    label: "Borrow",
    path: "/borrow",
    icon: <BorrowIcon sx={{ fontSize: 16 }} />,
  },
  {
    label: "Markets",
    path: "/markets",
    icon: <MarketsIcon sx={{ fontSize: 16 }} />,
  },
  { label: "Swap", path: "/swap", icon: <SwapIcon sx={{ fontSize: 16 }} /> },
  {
    label: "Portfolio",
    path: "/portfolio",
    icon: <PortfolioIcon sx={{ fontSize: 16 }} />,
  },
  { label: "Docs", path: "/docs", icon: <DocsIcon sx={{ fontSize: 16 }} /> },
];

// ─── Wallet Popup ─────────────────────────────────────────────────────────────
const WalletPopup: React.FC<{
  open: boolean;
  onClose: () => void;
  address: string;
  balance: string;
  onDisconnect: () => void;
}> = ({ open, onClose, address, balance, onDisconnect }) => {
  const [copied, setCopied] = useState(false);
  const initials = address.slice(5, 7).toUpperCase();
  const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 180,
          sx: { bgcolor: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" },
        },
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: "absolute",
            top: "72px",
            right: "24px",
            width: 290,
            borderRadius: "20px",
            outline: "none",
            background: "#ffffff",
            boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
            overflow: "hidden",
          }}
        >
          {/* Close */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              bgcolor: "#f1f5f9",
              color: "#64748b",
              width: 26,
              height: 26,
              "&:hover": { bgcolor: "#e2e8f0" },
            }}
          >
            <CloseIcon sx={{ fontSize: 13 }} />
          </IconButton>

          {/* Identity */}
          <Box sx={{ pt: 4, pb: 3, textAlign: "center", bgcolor: "#fafafa" }}>
            <Avatar
              sx={{
                width: 70,
                height: 70,
                mx: "auto",
                mb: 1.5,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                fontSize: "1.3rem",
                fontWeight: 800,
                boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
              }}
            >
              {initials}
            </Avatar>
            <Typography
              fontWeight={700}
              color="#0f172a"
              fontFamily="monospace"
              fontSize="1rem"
            >
              {short}
            </Typography>
            <Typography variant="body2" color="#64748b" mt={0.3}>
              {balance}
            </Typography>
          </Box>

          <Divider />

          {/* Actions */}
          <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
            {[
              {
                label: copied ? "Copied!" : "Copy Address",
                icon: <ContentCopy sx={{ fontSize: 20 }} />,
                onClick: copy,
                activeColor: "#10b981",
              },
              {
                label: "Disconnect",
                icon: <LogoutOutlined sx={{ fontSize: 20 }} />,
                onClick: () => {
                  onDisconnect();
                  onClose();
                },
                hoverBg: "#fef2f2",
                hoverColor: "#ef4444",
              },
            ].map((btn) => (
              <Button
                key={btn.label}
                fullWidth
                onClick={btn.onClick}
                sx={{
                  borderRadius: "12px",
                  py: 1.5,
                  flexDirection: "column",
                  gap: 0.4,
                  color:
                    copied && btn.label.includes("Copy")
                      ? "#10b981"
                      : "#334155",
                  bgcolor: "#f8fafc",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  border: "1px solid #e2e8f0",
                  "& .MuiButton-startIcon": { mr: 0, mb: 0 },
                  "&:hover": {
                    bgcolor: btn.hoverBg ?? "#f1f5f9",
                    color: btn.hoverColor ?? "#334155",
                  },
                }}
              >
                {btn.icon}
                {btn.label}
              </Button>
            ))}
          </Stack>

          {/* Explorer */}
          <Box sx={{ pb: 2, textAlign: "center" }}>
            <Button
              size="small"
              startIcon={<OpenInNew sx={{ fontSize: 11 }} />}
              href={`https://testnet.explorer.provable.com/address/${address}`}
              target="_blank"
              component="a"
              sx={{
                fontSize: "0.7rem",
                color: "#94a3b8",
                textTransform: "none",
                "&:hover": { color: "#6366f1" },
              }}
            >
              View on Explorer
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ─── AppLayout ────────────────────────────────────────────────────────────────
export const AppLayout: React.FC = () => {
  const { connected, address, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { balances } = usePrivLend();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const displayAddress = useMemo(() => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const displayBalance = useMemo(() => {
    if (!connected) return "";
    const aleo = Number(balances.credits) / 1_000_000;
    if (aleo >= 0.001) return `${aleo.toFixed(3)} ALEO`;
    return `${balances.credits.toString()} µALEO`;
  }, [balances.credits, connected]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setWalletOpen(false);
  }, [disconnect]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#0F172A",
      }}
    >
      <CssBaseline />

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(9,14,28,0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(245,158,11,0.12)",
          boxShadow: "0 1px 30px rgba(0,0,0,0.5)",
          zIndex: 1300,
        }}
      >
        <Toolbar
          sx={{ px: { xs: 2, md: 4 }, minHeight: "64px !important", gap: 1 }}
        >
          {/* Logo */}
          <Box
            onClick={() => navigate("/dashboard")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              cursor: "pointer",
              mr: { xs: "auto", md: 4 },
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 18px rgba(245,158,11,0.45)",
              }}
            >
              <Shield sx={{ fontSize: 18, color: "#0F172A" }} />
            </Box>
            <Typography
              sx={{
                fontFamily: '"Orbitron", sans-serif',
                fontWeight: 700,
                fontSize: "1rem",
                background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "0.04em",
              }}
            >
              PrivLend
            </Typography>
          </Box>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}
            >
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div key={item.path} whileTap={{ scale: 0.96 }}>
                    <Button
                      onClick={() => navigate(item.path)}
                      startIcon={item.icon}
                      sx={{
                        px: 2,
                        py: 0.8,
                        borderRadius: "10px",
                        fontSize: "0.875rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#F59E0B" : "rgba(255,255,255,0.5)",
                        background: isActive
                          ? "rgba(245,158,11,0.1)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(245,158,11,0.3)"
                          : "1px solid transparent",
                        transition: "all 0.18s ease",
                        "&:hover": {
                          color: "#FBBF24",
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.2)",
                        },
                        "& .MuiButton-startIcon": { mr: 0.6 },
                      }}
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                );
              })}
            </Box>
          )}

          {/* Wallet chip */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              ml: "auto",
              flexShrink: 0,
            }}
          >
            {!connected ? (
              <Button
                variant="contained"
                onClick={() => setVisible(true)}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  px: 2.5,
                  py: 0.8,
                  background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                  color: "#0F172A",
                  boxShadow: "0 4px 15px rgba(245,158,11,0.4)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #FBBF24, #FCD34D)",
                    boxShadow: "0 6px 20px rgba(245,158,11,0.55)",
                  },
                }}
              >
                Connect Wallet
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Box
                  onClick={() => setWalletOpen(true)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(9,14,28,0.9)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    "&:hover": {
                      borderColor: "rgba(245,158,11,0.5)",
                      background: "rgba(9,14,28,1)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 0.75,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      borderRight: "1px solid rgba(245,158,11,0.15)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                        boxShadow: "0 0 6px #10b981",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#6ee7b7",
                        fontFamily: "monospace",
                      }}
                    >
                      {displayBalance}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.75,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 22,
                        height: 22,
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        background: "linear-gradient(135deg,#F59E0B,#8B5CF6)",
                      }}
                    >
                      {address?.slice(5, 7).toUpperCase()}
                    </Avatar>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: "rgba(255,255,255,0.75)",
                        fontFamily: "monospace",
                      }}
                    >
                      {displayAddress}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            )}
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{ color: "rgba(255,255,255,0.7)", ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Wallet Popup */}
      {connected && address && (
        <WalletPopup
          open={walletOpen}
          onClose={() => setWalletOpen(false)}
          address={address}
          balance={displayBalance}
          onDisconnect={handleDisconnect}
        />
      )}

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            background: "#0F172A",
            borderLeft: "1px solid rgba(245,158,11,0.15)",
            pt: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2, mb: 2 }}>
          <IconButton
            onClick={() => setMobileOpen(false)}
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ px: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    borderRadius: 2,
                    background: isActive
                      ? "rgba(245,158,11,0.1)"
                      : "transparent",
                    border: isActive
                      ? "1px solid rgba(245,158,11,0.3)"
                      : "1px solid transparent",
                    color: isActive ? "#F59E0B" : "rgba(255,255,255,0.6)",
                  }}
                >
                  <Box sx={{ mr: 1.5, display: "flex" }}>{item.icon}</Box>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "0.9rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        {connected && address && (
          <Box sx={{ p: 2, mt: "auto" }}>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />
            <Stack spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  toast.success("Copied!");
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "text.secondary",
                  fontSize: "0.8rem",
                }}
              >
                Copy Address
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<LogoutOutlined />}
                onClick={() => {
                  disconnect();
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  borderColor: "rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  fontSize: "0.8rem",
                }}
              >
                Disconnect
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Page content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Container maxWidth="xl" sx={{ mt: 4, pb: 6 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Container>
      </Box>
    </Box>
  );
};
