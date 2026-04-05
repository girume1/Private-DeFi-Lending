import React, { useState, useEffect, useRef } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Slider,
  Box,
  Divider,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  AlertTitle,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { Grid } from "@mui/material";
import {
  Lock as LockIcon,
  Send as SendIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { usePrivLend } from "../context/PrivLendContext";
import { PROGRAM_ID } from "../utils/aleo";
import toast from "react-hot-toast";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  onOpenCreditTier?: () => void;
}

interface AleoRecord {
  id: string;
  owner?: string;
  program_id?: string;
  spent?: boolean;
  recordName?: string;
  data?: any;
  [key: string]: any;
}

const steps = ["Open Loan (Atomic)", "Completed"];

const DURATION_PRESETS: { label: string; blocks: number }[] = [
  { label: "~10 days (min)", blocks: 1440 },
  { label: "~30 days", blocks: 4320 },
  { label: "~90 days", blocks: 12960 },
  { label: "~6 months", blocks: 262800 },
  { label: "~1 year (max)", blocks: 525600 },
];

const INTEREST_PRESETS: { label: string; bps: number }[] = [
  { label: "2% (200 bps)", bps: 200 },
  { label: "5% (500 bps)", bps: 500 },
  { label: "10% (1000 bps)", bps: 1000 },
  { label: "15% (1500 bps)", bps: 1500 },
  { label: "20% max (2000 bps)", bps: 2000 },
];

const SUPPORTED_WALLETS = ["leo", "shield", "puzzle"];

export const LoanCreationForm: React.FC<Props> = ({
  onSuccess,
  onClose,
  onOpenCreditTier,
}) => {
  const walletContext = useWallet() as any;
  const {
    connected,
    address,
    executeTransaction,
    transactionStatus,
    requestRecords,
    wallet,
    decrypt,
  } = walletContext;

  // support requestRecordPlaintexts
  const requestRecordPlaintexts:
    | ((programId: string) => Promise<any>)
    | undefined = walletContext.requestRecordPlaintexts;

  const walletName: string = (
    (wallet as any)?.adapter?.name ??
    (wallet as any)?.name ??
    ""
  ).toLowerCase();

  const isUnsupportedWallet =
    connected && !SUPPORTED_WALLETS.some((w) => walletName.includes(w));

  const isShieldWallet = walletName.includes("shield");

  const { currentBlock, loanCounter, refreshData, balances, service } =
    usePrivLend();

  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [hasCreditTier, setHasCreditTier] = useState(false);
  const [checkingTier, setCheckingTier] = useState(true);
  const [manualChecking, setManualChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
    lender: "",
    principal: 1000,
    collateral: 1500,
    interest_bps: 500,
    duration_blocks: 4320,
  });

  const parseTierValue = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const n = parseInt(val.replace(/u\d+$/, ""), 10);
      return isNaN(n) ? null : n;
    }
    return null;
  };

  const findCreditTierRecord = (records: AleoRecord[]): AleoRecord | null => {
    for (const r of records) {
      if (r.spent) continue;

      // (requestRecords) returns encrypted records with recordName set
      if (r.recordName === "CreditTier") return r;

      // requestRecordPlaintexts — check decrypted data fields
      const data = (r as any).data?.value ?? (r as any).data;
      if (!data) continue;

      const tierVal = parseTierValue(data.tier);
      const nonceExists = data.nonce !== undefined;

      if (tierVal !== null && tierVal >= 0 && tierVal <= 2 && nonceExists) {
        return r;
      }
    }
    return null;
  };

  const fetchRecords = async (): Promise<AleoRecord[]> => {
    let records: AleoRecord[] = [];

    // First try: requestRecords with plaintext=true
    if (requestRecords) {
      try {
        const result = await (requestRecords as any)(PROGRAM_ID, true);
        records = Array.isArray(result) ? result : (result?.records ?? []);
        console.log(
          `[PrivLend] requestRecords(plaintext=true) (${walletName}): ${records.length} records`,
        );
        if (records.length > 0) {
          console.log(
            "[PrivLend] Sample record keys:",
            Object.keys(records[0]),
          );
          return records;
        }
      } catch (e) {
        console.warn("[PrivLend] requestRecords(plaintext=true) failed:", e);
      }
    }

    // Second try: requestRecordPlaintexts
    if (requestRecordPlaintexts) {
      try {
        const result = await requestRecordPlaintexts(PROGRAM_ID);
        records = Array.isArray(result) ? result : (result?.records ?? []);
        console.log(
          `[PrivLend] requestRecordPlaintexts (${walletName}): ${records.length} records`,
        );
        if (records.length > 0) return records;
      } catch (e) {
        console.warn("[PrivLend] requestRecordPlaintexts failed:", e);
      }
    }

    // Last resort: requestRecords without plaintext (encrypted only)
    if (requestRecords && records.length === 0) {
      try {
        const result = (await requestRecords(PROGRAM_ID)) as AleoRecord[];
        records = Array.isArray(result) ? result : [];
        console.log(
          `[PrivLend] requestRecords(no plaintext) (${walletName}): ${records.length} records`,
        );
      } catch (e) {
        console.warn("[PrivLend] requestRecords fallback failed:", e);
      }
    }

    return records;
  };

  const checkCreditTier = async (): Promise<boolean> => {
    if (!connected || !address) {
      setDebugInfo("Wallet not connected");
      return false;
    }
    try {
      const records = await fetchRecords();
      console.log("[PrivLend] records:", JSON.stringify(records, null, 2));

      const tierRecord = findCreditTierRecord(records);
      if (tierRecord) {
        setDebugInfo(`Credit tier found (${tierRecord.id?.slice(0, 16)}...)`);
        return true;
      }

      if (records.length === 0) {
        setDebugInfo(
          isUnsupportedWallet
            ? `${walletName || "This wallet"} does not support reading private records. Please use Leo Wallet or Shield Wallet.`
            : isShieldWallet
              ? "No records found in Shield Wallet — make sure you have created a credit tier and the transaction is confirmed."
              : "No records in wallet — create a credit tier first",
        );
      } else {
        setDebugInfo(
          `${records.length} record(s) found but none qualify as CreditTier`,
        );
      }
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[PrivLend] checkCreditTier error:", error);
      setDebugInfo(`Error: ${msg}`);
      return false;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!connected || !address) {
        setHasCreditTier(false);
        setCheckingTier(false);
        return;
      }
      setCheckingTier(true);
      try {
        const result = await checkCreditTier();
        if (!cancelled) setHasCreditTier(result);
      } catch {
        if (!cancelled) setHasCreditTier(false);
      } finally {
        if (!cancelled) setCheckingTier(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [connected, address]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleSliderChange =
    (field: string) => (_: any, value: number | number[]) => {
      const v = value as number;
      setFormData((prev) => ({
        ...prev,
        [field]: v,
        ...(field === "principal" && { collateral: Math.ceil(v * 1.5) }),
      }));
    };

  const manuallyCheckTier = async () => {
    if (!connected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }
    setManualChecking(true);
    try {
      const hasValid = await checkCreditTier();
      setHasCreditTier(hasValid);
      hasValid
        ? toast.success("Credit tier found!")
        : toast.error("No valid credit tier — check console for details.");
    } catch {
      toast.error("Failed to check credit tier");
    } finally {
      setManualChecking(false);
    }
  };

  const waitForConfirmation = (txId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;

      pollingRef.current = setInterval(async () => {
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
            clearInterval(pollingRef.current!);
            resolve();
            return;
          }

          if (
            s.includes("failed") ||
            s.includes("rejected") ||
            s.includes("error")
          ) {
            clearInterval(pollingRef.current!);
            reject(
              new Error(`Transaction ${txId.slice(0, 12)}... was rejected`),
            );
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollingRef.current!);
            reject(
              new Error(`Transaction ${txId.slice(0, 12)}... timed out (60s)`),
            );
          }
        } catch (err) {
          console.error("[PrivLend] Polling error:", err);
        }
      }, 3000);
    });
  };

  const handleSubmit = async () => {
    if (!connected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }
    if (!hasCreditTier) {
      toast.error("You need a credit tier before creating a loan");
      return;
    }
    if (!currentBlock) {
      toast.error("Waiting for block data — please try again in a moment");
      return;
    }
    if (loading) return;

    if (BigInt(formData.collateral) > balances.credits) {
      toast.error(
        `Insufficient microcredits balance. You have ${balances.credits.toString()} microcredits`,
      );
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Preparing transaction...");

    try {
      const records = await fetchRecords();
      const tierRecord = findCreditTierRecord(records);

      if (!tierRecord) {
        throw new Error("No valid credit tier found. Please create one first.");
      }

      console.log(
        "[PrivLend] Full tier record:",
        JSON.stringify(tierRecord, null, 2),
      );

      // fetch a fresh counter right before submitting to avoid loan ID collisions
      const freshCounter = await service.getLoanCounter();
      const newLoanId = freshCounter + 1;
      console.log(
        "[PrivLend] Fresh loan counter:",
        freshCounter,
        "→ new loan ID:",
        newLoanId,
      );

      let creditInput: any;
      try {
        const ciphertext = (tierRecord as any).recordCiphertext;
        if (ciphertext && decrypt) {
          console.log(
            "[PrivLend] Decrypting CreditTier via wallet decrypt()...",
          );
          creditInput = await decrypt(ciphertext);
          console.log("[PrivLend] Decrypted creditInput:", creditInput);
        } else if (
          (tierRecord as any).plaintext &&
          typeof (tierRecord as any).plaintext === "string"
        ) {
          creditInput = (tierRecord as any).plaintext;
          console.log("[PrivLend] creditInput: existing plaintext string");
        } else {
          creditInput = tierRecord;
          console.log("[PrivLend] creditInput: full object fallback");
        }
      } catch (e) {
        console.warn("[PrivLend] decrypt() failed, falling back to object:", e);
        creditInput = (tierRecord as any).plaintext ?? tierRecord;
      }

      // force all numeric inputs to safe integers — floats like "1000.0u128" are rejected
      const principalInt = Math.floor(Number(formData.principal));
      const collateralInt = Math.floor(Number(formData.collateral));
      const interestInt = Math.floor(Number(formData.interest_bps));
      const durationInt = Math.floor(Number(formData.duration_blocks));
      const blockInt = Math.floor(Number(currentBlock));

      console.log("[PrivLend] open_loan inputs:", {
        newLoanId,
        blockInt,
        lender: formData.lender,
        credit:
          typeof creditInput === "string"
            ? creditInput.slice(0, 30) + "..."
            : "[record object]",
        principalInt,
        collateralInt,
        interestInt,
        durationInt,
      });

      setActiveStep(0);
      toast.loading(
        isShieldWallet
          ? "Confirm transaction in Shield Wallet..."
          : "Creating atomic loan transaction...",
        { id: toastId },
      );

      const privateTx = await executeTransaction({
        program: PROGRAM_ID,
        function: "open_loan",
        inputs: [
          `${newLoanId}u32`,
          `${blockInt}u32`,
          formData.lender,
          creditInput,
          `${principalInt}u128`,
          `${collateralInt}u64`,
          `${interestInt}u16`,
          `${durationInt}u32`,
        ] as any[],
        fee: 350_000,
        privateFee: false,
      });

      if (!privateTx?.transactionId) {
        throw new Error("Transaction was not submitted (no transactionId)");
      }

      toast.loading("Waiting for confirmation...", { id: toastId });
      await waitForConfirmation(privateTx.transactionId);

      setActiveStep(1);
      toast.success("Loan created successfully! 🎉", { id: toastId });

      await refreshData();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("[PrivLend] Loan creation error:", err);
      toast.error(err.message || "Loan creation failed", { id: toastId });
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const isValidLender =
    typeof formData.lender === "string" &&
    formData.lender.startsWith("aleo1") &&
    formData.lender.length === 63;

  const minCollateral = Math.ceil(formData.principal * 1.5);
  const isValidCollateral = formData.collateral >= minCollateral;
  const isBlockReady = currentBlock > 0;
  const hasEnoughCredits = BigInt(formData.collateral) <= balances.credits;

  const isValid =
    isValidLender &&
    formData.principal >= 100 &&
    isValidCollateral &&
    hasEnoughCredits &&
    hasCreditTier &&
    !checkingTier &&
    isBlockReady &&
    !isUnsupportedWallet;

  if (checkingTier) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Checking credit tier
          {isShieldWallet ? " via Shield Wallet..." : "..."}
        </Typography>
      </Paper>
    );
  }

  if (!hasCreditTier) {
    return (
      <Paper sx={{ p: 4, borderRadius: 4 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <WarningIcon sx={{ fontSize: 48, color: "warning.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Credit Tier Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            You need a CreditTier record in your wallet before creating a loan.
          </Typography>

          {debugInfo && (
            <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
              <AlertTitle>Debug Info</AlertTitle>
              <Typography
                variant="body2"
                component="pre"
                sx={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}
              >
                {debugInfo}
              </Typography>
            </Alert>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              onClose();
              onOpenCreditTier?.();
            }}
          >
            Create Credit Tier
          </Button>
          <Button
            variant="text"
            onClick={manuallyCheckTier}
            disabled={manualChecking}
            startIcon={
              manualChecking ? <CircularProgress size={16} /> : <RefreshIcon />
            }
          >
            {manualChecking ? "Checking..." : "Refresh Check"}
          </Button>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 4 },
        background: "linear-gradient(135deg, #1e293b, #0f172a)",
        border: "1px solid #334155",
        borderRadius: 4,
      }}
    >
      {!isBlockReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Waiting for current block height — please wait before submitting.
        </Alert>
      )}

      {!hasEnoughCredits && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Insufficient Microcredits</AlertTitle>
          You need {formData.collateral.toLocaleString()} microcredits for
          collateral. Current balance: {balances.credits.toString()}{" "}
          microcredits.
        </Alert>
      )}

      {/* error message lists Shield as supported */}
      {isUnsupportedWallet && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Wallet Not Supported</AlertTitle>
          <strong>{wallet?.adapter?.name ?? "Your wallet"}</strong> does not
          support reading private records required for loan creation. Please
          switch to <strong>Leo Wallet</strong> or{" "}
          <strong>Shield Wallet</strong>.
        </Alert>
      )}

      {/* ✅ Shield Wallet info banner */}
      {isShieldWallet && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Shield Wallet detected ✅ — private record access is supported.
        </Alert>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <motion.div
          animate={{ rotate: loading ? 360 : 0 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <LockIcon sx={{ fontSize: 40, color: "primary.main" }} />
        </motion.div>
        <Typography variant="h4" fontWeight="bold">
          Create New Loan
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ "& .MuiStepLabel-label": { color: "white" } }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Lender Address"
            value={formData.lender}
            onChange={(e) =>
              setFormData({ ...formData, lender: e.target.value })
            }
            error={formData.lender !== "" && !isValidLender}
            helperText={
              formData.lender !== "" && !isValidLender
                ? "Must be a valid aleo1... address (63 chars)"
                : ""
            }
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <Typography gutterBottom>Principal (USDCx)</Typography>
          <Slider
            value={formData.principal}
            onChange={handleSliderChange("principal")}
            min={100}
            max={10000}
            step={100}
            valueLabelDisplay="auto"
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            label="Principal amount (USDCx)"
            value={formData.principal}
            onChange={(e) => {
              const val = Math.max(100, Number(e.target.value));
              setFormData((prev) => ({
                ...prev,
                principal: val,
                collateral: Math.ceil(val * 1.5),
              }));
            }}
            inputProps={{ min: 100, max: 10000 }}
            sx={{ mt: 1, mb: 3 }}
            disabled={loading}
          />

          <FormControl fullWidth sx={{ mb: 3 }} disabled={loading}>
            <InputLabel>Interest Rate</InputLabel>
            <Select
              value={formData.interest_bps}
              label="Interest Rate"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  interest_bps: Number(e.target.value),
                }))
              }
            >
              {INTEREST_PRESETS.map((p) => (
                <MenuItem key={p.bps} value={p.bps}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Max 20% (2000 bps) per contract</FormHelperText>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography gutterBottom>
            Collateral (microcredits) — min {minCollateral.toLocaleString()}{" "}
            (150%)
          </Typography>
          <Slider
            value={formData.collateral}
            onChange={handleSliderChange("collateral")}
            min={minCollateral}
            max={formData.principal * 5}
            step={100}
            valueLabelDisplay="auto"
            disabled={loading}
          />
          <TextField
            fullWidth
            type="number"
            label="Collateral amount (microcredits)"
            value={formData.collateral}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                collateral: Number(e.target.value),
              }))
            }
            error={!isValidCollateral}
            helperText={
              !isValidCollateral
                ? `Minimum 150% required (${minCollateral.toLocaleString()})`
                : ""
            }
            sx={{ mt: 1, mb: 3 }}
            disabled={loading}
          />

          <FormControl fullWidth sx={{ mb: 3 }} disabled={loading}>
            <InputLabel>Loan Duration</InputLabel>
            <Select
              value={formData.duration_blocks}
              label="Loan Duration"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  duration_blocks: Number(e.target.value),
                }))
              }
            >
              {DURATION_PRESETS.map((p) => (
                <MenuItem key={p.blocks} value={p.blocks}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>
              Current block:{" "}
              {currentBlock > 0 ? currentBlock.toLocaleString() : "...loading"}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Loan ID: <strong>{Math.max(loanCounter, 0) + 1}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            LTV:{" "}
            <strong>
              {formData.collateral > 0
                ? ((formData.principal / formData.collateral) * 100).toFixed(1)
                : "—"}
              %
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deadline block:{" "}
            <strong>
              {currentBlock > 0
                ? (currentBlock + formData.duration_blocks).toLocaleString()
                : "..."}
            </strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your balance:{" "}
            <strong>{balances.credits.toString()} microcredits</strong>
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={!isValid || loading}
          sx={{
            px: 4,
            py: 1.5,
            background: "linear-gradient(135deg, #F59E0B, #8b5cf6)",
            borderRadius: 2,
          }}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
        >
          {loading ? "Processing..." : "Open Loan"}
        </Button>
      </Box>
    </Paper>
  );
};
