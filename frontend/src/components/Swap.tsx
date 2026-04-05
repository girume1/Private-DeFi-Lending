import React, { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  Stack,
  Chip,
} from "@mui/material";
import { SwapHoriz as SwapIcon, ArrowDownward } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { usePrivLend } from "../context/PrivLendContext";
import { PROGRAM_ID } from "../utils/aleo";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
}

export const Swap: React.FC<Props> = ({ onSuccess, onClose }) => {
  const { connected, address, executeTransaction, transactionStatus } =
    useWallet();
  const { balances, refreshBalances } = usePrivLend();

  const [direction, setDirection] = useState<
    "credits-to-usdcx" | "usdcx-to-credits"
  >("credits-to-usdcx");
  // User enters in ALEO (not microcredits) for credits direction
  const [amountIn, setAmountIn] = useState("");
  const [loading, setLoading] = useState(false);

  // Display balances in human-readable form
  const aleoDisplay = useMemo(
    () => (Number(balances.credits) / 1_000_000).toFixed(6),
    [balances.credits],
  );
  const usdcxDisplay = useMemo(
    () => balances.usdcx.toString(),
    [balances.usdcx],
  );

  const fromLabel = direction === "credits-to-usdcx" ? "ALEO" : "USDCx";
  const toLabel = direction === "credits-to-usdcx" ? "USDCx" : "ALEO";
  const fromBal = direction === "credits-to-usdcx" ? aleoDisplay : usdcxDisplay;

  // Convert user input to raw on-chain values
  const rawAmountIn = useMemo((): bigint => {
    const n = parseFloat(amountIn);
    if (isNaN(n) || n <= 0) return 0n;
    if (direction === "credits-to-usdcx") {
      // User enters ALEO → convert to microcredits (×1_000_000)
      return BigInt(Math.floor(n * 1_000_000));
    } else {
      // User enters USDCx → raw u128
      return BigInt(Math.floor(n));
    }
  }, [amountIn, direction]);

  const estimatedOut = useMemo((): string => {
    const n = parseFloat(amountIn);
    if (isNaN(n) || n <= 0) return "0";
    // 1:1 rate on testnet (microcredits ↔ USDCx raw units)
    if (direction === "credits-to-usdcx") {
      // rawIn microcredits → rawOut USDCx (same number)
      return Math.floor(n * 1_000_000).toString();
    } else {
      // rawIn USDCx → rawOut microcredits → display as ALEO
      return (n / 1_000_000).toFixed(6);
    }
  }, [amountIn, direction]);

  const hasEnough = useMemo(() => {
    if (rawAmountIn <= 0n) return true;
    if (direction === "credits-to-usdcx")
      return rawAmountIn <= balances.credits;
    return rawAmountIn <= balances.usdcx;
  }, [rawAmountIn, direction, balances]);

  const toggleDirection = () => {
    setDirection((d) =>
      d === "credits-to-usdcx" ? "usdcx-to-credits" : "credits-to-usdcx",
    );
    setAmountIn("");
  };

  const setMax = () => {
    if (direction === "credits-to-usdcx") {
      setAmountIn(aleoDisplay);
    } else {
      setAmountIn(usdcxDisplay);
    }
  };

  const waitForConfirmation = (txId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await transactionStatus(txId);
          const s =
            (typeof status === "string"
              ? status
              : (status as any)?.status
            )?.toLowerCase() ?? "";
          if (
            s.includes("accepted") ||
            s.includes("completed") ||
            s.includes("success")
          ) {
            clearInterval(interval);
            resolve();
            return;
          }
          if (
            s.includes("failed") ||
            s.includes("rejected") ||
            s.includes("error")
          ) {
            clearInterval(interval);
            reject(new Error("Transaction rejected"));
            return;
          }
          if (attempts >= 20) {
            clearInterval(interval);
            reject(new Error("Transaction timed out"));
          }
        } catch {}
      }, 3000);
    });

  const handleSwap = async () => {
    if (!connected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (rawAmountIn <= 0n) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!hasEnough) {
      toast.error(`Insufficient ${fromLabel} balance`);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Submitting swap...");

    try {
      const functionName =
        direction === "credits-to-usdcx"
          ? "swap_credits_for_usdcx"
          : "swap_usdcx_for_credits";

      // Build inputs: amounts are raw on-chain values
      // swap_credits_for_usdcx(amount_in: u64, min_out: u128)
      // swap_usdcx_for_credits(amount_in: u128, min_out: u64)
      const inputs =
        direction === "credits-to-usdcx"
          ? [`${rawAmountIn}u64`, `${rawAmountIn}u128`] // min_out = same (1:1, no slippage on testnet)
          : [`${rawAmountIn}u128`, `${rawAmountIn}u64`];

      console.log("[Swap] Calling", functionName, "with inputs:", inputs);

      const tx = await executeTransaction({
        program: PROGRAM_ID,
        function: functionName,
        inputs,
        fee: 300_000, // increased fee for reliability
        privateFee: false,
      });

      if (!tx?.transactionId) throw new Error("No transactionId returned");

      toast.loading("Waiting for confirmation...", { id: toastId });
      await waitForConfirmation(tx.transactionId);

      await refreshBalances();
      toast.success(`Swap successful! 🎉`, { id: toastId });
      setAmountIn("");
      onSuccess();
    } catch (err: any) {
      console.error("[Swap] Error:", err);
      toast.error(err.message || "Swap failed", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const isValid = rawAmountIn > 0n && hasEnough;

  return (
    <Paper
      sx={{
        p: 4,
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        border: "1px solid #334155",
        borderRadius: 4,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <motion.div
          animate={{ rotate: loading ? 360 : 0 }}
          transition={{
            duration: 1.5,
            repeat: loading ? Infinity : 0,
            ease: "linear",
          }}
        >
          <SwapIcon sx={{ fontSize: 32, color: "#F59E0B" }} />
        </motion.div>
        <Typography variant="h5" fontWeight={700}>
          Swap Tokens
        </Typography>
        <Chip
          label="1:1 Testnet Rate"
          size="small"
          sx={{
            ml: "auto",
            bgcolor: "rgba(16,185,129,0.1)",
            color: "#10b981",
            border: "1px solid rgba(16,185,129,0.2)",
            fontSize: "0.7rem",
          }}
        />
      </Stack>

      {/* From */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.06)",
          mb: 1,
        }}
      >
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
          >
            From
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.disabled">
              Balance: {fromBal}
            </Typography>
            <Button
              size="small"
              onClick={setMax}
              sx={{
                fontSize: "0.65rem",
                py: 0.2,
                px: 1,
                minWidth: 0,
                height: 20,
                bgcolor: "rgba(245,158,11,0.15)",
                color: "#FCD34D",
                borderRadius: 1,
              }}
            >
              MAX
            </Button>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={2}>
          <TextField
            fullWidth
            variant="standard"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: "any" }}
            disabled={loading}
            error={!hasEnough && amountIn !== ""}
            sx={{
              "& .MuiInput-root": {
                fontSize: "1.8rem",
                fontWeight: 700,
                color: !hasEnough && amountIn ? "#ef4444" : "white",
              },
              "& .MuiInput-root::before": { display: "none" },
              "& .MuiInput-root::after": { display: "none" },
            }}
          />
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              flexShrink: 0,
              bgcolor:
                direction === "credits-to-usdcx"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(245,158,11,0.15)",
              border: `1px solid ${direction === "credits-to-usdcx" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
          >
            <Typography
              fontWeight={700}
              sx={{
                color: direction === "credits-to-usdcx" ? "#f59e0b" : "#FBBF24",
              }}
            >
              {fromLabel}
            </Typography>
          </Box>
        </Stack>
        {!hasEnough && amountIn && (
          <Typography variant="caption" color="error" mt={0.5} display="block">
            Insufficient {fromLabel} balance
          </Typography>
        )}
      </Box>

      {/* Swap Arrow */}
      <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Box
            onClick={toggleDirection}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              cursor: "pointer",
              bgcolor: "#111827",
              border: "2px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: "rgba(245,158,11,0.2)",
                borderColor: "#F59E0B",
              },
            }}
          >
            <ArrowDownward sx={{ fontSize: 18, color: "#94a3b8" }} />
          </Box>
        </motion.div>
      </Box>

      {/* To */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          bgcolor: "rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.06)",
          mb: 3,
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            mb: 1,
          }}
        >
          To (estimated)
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography
            sx={{
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#6ee7b7",
              flex: 1,
            }}
          >
            {estimatedOut || "0"}
          </Typography>
          <Box
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              flexShrink: 0,
              bgcolor:
                direction === "usdcx-to-credits"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(245,158,11,0.15)",
              border: `1px solid ${direction === "usdcx-to-credits" ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.3)"}`,
            }}
          >
            <Typography
              fontWeight={700}
              sx={{
                color: direction === "usdcx-to-credits" ? "#f59e0b" : "#FBBF24",
              }}
            >
              {toLabel}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Alert
        severity="info"
        sx={{ mb: 3, borderRadius: 2, fontSize: "0.8rem" }}
      >
        Testnet 1:1 rate. Enter amount in <strong>{fromLabel}</strong> units.
        {direction === "credits-to-usdcx" &&
          ' (e.g. "1.5" = 1.5 ALEO = 1,500,000 microcredits)'}
      </Alert>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSwap}
        disabled={!isValid || loading}
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "1rem",
          background: isValid
            ? "linear-gradient(135deg, #F59E0B, #8b5cf6)"
            : undefined,
          boxShadow: isValid ? "0 4px 20px rgba(245,158,11,0.3)" : undefined,
        }}
        startIcon={
          loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SwapIcon />
          )
        }
      >
        {loading ? "Swapping..." : `Swap ${fromLabel} → ${toLabel}`}
      </Button>
    </Paper>
  );
};
