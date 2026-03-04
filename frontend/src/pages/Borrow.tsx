import React, { useState } from "react";
import { Box, Typography, Paper, Dialog, DialogContent, Alert, Stack, Chip, Button } from "@mui/material";
import { Add as AddIcon, AssignmentTurnedIn as TierIcon, AccountBalanceWallet as WalletIcon } from "@mui/icons-material";
import { LoanCreationForm } from "../components/LoanCreationForm";
import { CreditTierCreator } from "../components/CreditTierCreator";
import { usePrivLend } from "../context/PrivLendContext";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { motion } from "framer-motion";

export const Borrow: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  const {
    activeUserLoans,
    expiredUserLoans,
    settledUserLoans,
    refreshData
  } = usePrivLend();

  const [showTierModal, setShowTierModal] =
    useState(false);
  const [showLoanModal, setShowLoanModal] =
    useState(false);

  if (!connected) {
    return (
      <Box
        textAlign="center"
        py={8}
      >
        <Typography variant="h5" mb={2}>
          Connect your wallet to borrow
        </Typography>

        <Button
          variant="contained"
          startIcon={<WalletIcon />}
          onClick={() => setVisible(true)}
        >
          Connect Wallet
        </Button>
      </Box>
    );
  }

  const totalLoans =
    activeUserLoans.length +
    expiredUserLoans.length +
    settledUserLoans.length;

  const exposureCount =
    activeUserLoans.length;

  return (
    <Box>
      {/* Header */}
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ mb: 2 }}
      >
        Borrow Capital
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Privately request funds using your credit proof
      </Typography>

      {/* Portfolio Summary */}
      {totalLoans > 0 && (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Chip
            label={`Active: ${activeUserLoans.length}`}
          />
          <Chip
            label={`Expired: ${expiredUserLoans.length}`}
            color="error"
          />
          <Chip
            label={`Total: ${totalLoans}`}
          />
        </Stack>
      )}

      {expiredUserLoans.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          You have{" "}
          {expiredUserLoans.length} loan(s)
          eligible for liquidation.
        </Alert>
      )}

      {/* Borrow Steps */}
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row"
          },
          gap: 3
        }}
      >
        {/* Step 1 */}
        <motion.div
          whileHover={{ y: -5 }}
          style={{ flex: 1 }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, #1e293b, #0f172a)",
              border:
                "1px solid rgba(255,255,255,0.08)"
            }}
            onClick={() =>
              setShowTierModal(true)
            }
          >
            <TierIcon
              sx={{
                fontSize: 50,
                color: "primary.main",
                mb: 2
              }}
            />

            <Typography variant="h6">
              Step 1: Create Credit Tier
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Generate your private risk profile
            </Typography>
          </Paper>
        </motion.div>

        {/* Step 2 */}
        <motion.div
          whileHover={{ y: -5 }}
          style={{ flex: 1 }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, #1e293b, #0f172a)",
              border:
                "1px solid rgba(255,255,255,0.08)"
            }}
            onClick={() =>
              setShowLoanModal(true)
            }
          >
            <AddIcon
              sx={{
                fontSize: 50,
                color: "secondary.main",
                mb: 2
              }}
            />

            <Typography variant="h6">
              Step 2: Create Loan
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Request capital with your proof
            </Typography>
          </Paper>
        </motion.div>
      </Box>

      {/* Credit Tier Modal */}
      <CreditTierCreator
        open={showTierModal}
        onClose={() =>
          setShowTierModal(false)
        }
        onSuccess={refreshData}
      />

      {/* Loan Modal */}
      <Dialog
        open={showLoanModal}
        onClose={() =>
          setShowLoanModal(false)
        }
        maxWidth="md"
        fullWidth
      >
        <DialogContent
          sx={{ p: 0, bgcolor: "#0f172a" }}
        >
          <LoanCreationForm
            onSuccess={refreshData}
            onClose={() =>
              setShowLoanModal(false)
            }
            onOpenCreditTier={() =>
              setShowTierModal(true)
            }
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
