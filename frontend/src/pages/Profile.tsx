import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Stack,
  TextField,
  IconButton
} from "@mui/material";
import {
  AccountCircle,
  OpenInNew,
  TrendingUp,
  Warning,
  CheckCircle,
  Edit,
  Save
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { usePrivLend } from "../context/PrivLendContext";
import CountUp from "react-countup";

const TESTNET_EXPLORER =
  "https://testnet.explorer.provable.com/address/";

interface UserProfile {
  username: string;
  avatar: string | null;
}

export const Profile: React.FC = () => {
  const { address } = useWallet();
  const {
    userLoans,
    expiredLoans,
    stats,
    transactionHistory
  } = usePrivLend();

  const activeLoans = userLoans.filter(l => l.active);

  const [profile, setProfile] = useState<UserProfile>({
    username: "",
    avatar: null
  });

  const [editing, setEditing] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    if (!address) return;

    const saved = localStorage.getItem(`profile_${address}`);
    if (saved) {
      setProfile(JSON.parse(saved));
    } else {
      setProfile({
        username: `User_${address.slice(0, 6)}`,
        avatar: null
      });
    }
  }, [address]);

  const handleSave = () => {
    if (!address) return;
    localStorage.setItem(`profile_${address}`, JSON.stringify(profile));
    setEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile(prev => ({
        ...prev,
        avatar: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box>
      {/* HEADER */}
      <Typography variant="h4" fontWeight="bold" mb={4}>
        My Profile
      </Typography>

      {/* PROFILE CARD */}
      <motion.div whileHover={{ scale: 1.01 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: 4,
            background:
              "linear-gradient(135deg, #1e293b, #0f172a)",
            border: "1px solid #334155",
            mb: 4
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center">
            {/* AVATAR */}
            <Box position="relative">
              <Avatar
                src={profile.avatar ?? undefined}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#6366f1",
                  border: "3px solid #1e293b",
                  boxShadow: "0 0 20px rgba(99,102,241,0.4)"
                }}
              >
                {!profile.avatar && (
                  <AccountCircle fontSize="large" />
                )}
              </Avatar>

              {editing && (
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "#6366f1",
                    color: "white",
                    width: 36,
                    height: 36,
                    "&:hover": {
                      bgcolor: "#8b5cf6"
                    }
                  }}
                >
                  <Edit fontSize="small" />
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </IconButton>
              )}
            </Box>

            {/* USER INFO */}
            <Box flex={1}>
              {editing ? (
                <TextField
                  fullWidth
                  value={profile.username}
                  onChange={e =>
                    setProfile(prev => ({
                      ...prev,
                      username: e.target.value
                    }))
                  }
                />
              ) : (
                <Typography variant="h5">
                  {profile.username}
                </Typography>
              )}

              {/* Wallet address hide/show */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                mt={1}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  {showAddress
                    ? address
                    : `${address?.slice(0, 6)}...${address?.slice(-4)}`}
                </Typography>

                <Button
                  size="small"
                  onClick={() =>
                    setShowAddress(prev => !prev)
                  }
                >
                  {showAddress ? "Hide" : "Show"}
                </Button>
              </Stack>
            </Box>

            {/* EDIT / SAVE */}
            {editing ? (
              <IconButton onClick={handleSave}>
                <Save />
              </IconButton>
            ) : (
              <IconButton
                onClick={() => setEditing(true)}
              >
                <Edit />
              </IconButton>
            )}

            {/* EXPLORER */}
            <Button
              variant="outlined"
              startIcon={<OpenInNew />}
              href={`${TESTNET_EXPLORER}${address}`}
              target="_blank"
            >
              Explorer
            </Button>
          </Stack>
        </Paper>
      </motion.div>

      {/* METRICS */}
      <Stack direction="row" spacing={3} mb={4}>
        <MetricCard
          title="Active Loans"
          value={activeLoans.length}
          icon={<TrendingUp />}
          color="#10b981"
        />

        <MetricCard
          title="Expired"
          value={expiredLoans.length}
          icon={<Warning />}
          color="#ef4444"
        />

        <MetricCard
          title="Total Loans"
          value={stats.totalLoans}
          icon={<CheckCircle />}
          color="#6366f1"
        />
      </Stack>

      {/* RECENT ACTIVITY */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 4,
          background: "#0f172a",
          border: "1px solid #334155"
        }}
      >
        <Typography variant="h6" mb={2}>
          Recent Activity
        </Typography>

        {transactionHistory.length === 0 ? (
          <Typography color="text.secondary">
            No transactions yet.
          </Typography>
        ) : (
          transactionHistory.slice(0, 5).map(tx => (
            <Stack
              key={tx.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              py={1}
            >
              <Typography>
                {tx.type}
              </Typography>

              <Chip
                label={tx.status}
                color={
                  tx.status === "Completed"
                    ? "success"
                    : tx.status === "Failed"
                    ? "error"
                    : "warning"
                }
              />
            </Stack>
          ))
        )}
      </Paper>
    </Box>
  );
};

const MetricCard = ({
  title,
  value,
  icon,
  color
}: any) => (
  <Paper
    sx={{
      flex: 1,
      p: 3,
      borderRadius: 4,
      background: `linear-gradient(135deg, ${color}20, ${color}05)`,
      border: `1px solid ${color}40`
    }}
  >
    <Stack direction="row" justifyContent="space-between">
      <Typography color="text.secondary">
        {title}
      </Typography>
      {icon}
    </Stack>

    <Typography variant="h4" fontWeight="bold" mt={2}>
      <CountUp end={value} duration={1.5} />
    </Typography>
  </Paper>
);