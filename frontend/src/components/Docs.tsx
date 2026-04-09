import React from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Button,
  alpha,
  useTheme,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Lock as LockIcon,
  VisibilityOff as PrivacyIcon,
  ReceiptLong as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  Timeline as TimelineIcon,
  Shield as ShieldIcon,
  AccountBalance as BalanceIcon,
  SwapHoriz as SwapIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon,
  Celebration as CelebrationIcon,
  CurrencyExchange as CurrencyIcon,
  TrendingUp as TrendingIcon,
  Grade as GradeIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";

interface DocsProps {
  variant?: "full" | "compact";
  showHeader?: boolean;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay: number;
}> = ({ icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -6 }}
  >
    <Paper
      sx={{
        p: 3,
        height: "100%",
        borderRadius: 4,
        cursor: "pointer",
        background: `linear-gradient(145deg, ${alpha(color, 0.12)}, ${alpha(color, 0.04)})`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: "all 0.25s ease",
        "&:hover": {
          borderColor: color,
          boxShadow: `0 16px 40px ${alpha(color, 0.2)}`,
        },
      }}
    >
      <Box sx={{ color, mb: 2, fontSize: "2.2rem" }}>{icon}</Box>
      <Typography
        variant="h6"
        sx={{
          color: "white",
          fontWeight: 700,
          mb: 1,
          fontFamily: '"Orbitron", sans-serif',
          fontSize: "0.95rem",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}
      >
        {description}
      </Typography>
    </Paper>
  </motion.div>
);

const StepCard: React.FC<{
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = ({ number, title, description, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: number * 0.1 }}
  >
    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
      <Avatar
        sx={{
          bgcolor: alpha(color, 0.15),
          color,
          width: 48,
          height: 48,
          border: `2px solid ${color}`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Avatar>
      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            color: "white",
            fontWeight: 700,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "0.85rem",
          }}
        >
          {number}. {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  </motion.div>
);

const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <Paper
    sx={{
      p: 2,
      bgcolor: "#020617",
      border: "1px solid #1e293b",
      borderRadius: 2,
      overflow: "auto",
    }}
  >
    <Typography
      component="pre"
      sx={{
        color: "#94a3b8",
        fontFamily: "monospace",
        fontSize: "0.82rem",
        lineHeight: 1.8,
        m: 0,
      }}
    >
      {code}
    </Typography>
  </Paper>
);

export const Docs: React.FC<DocsProps> = ({
  variant = "full",
  showHeader = true,
}) => {
  const theme = useTheme();

  const features = [
    {
      icon: <PrivacyIcon />,
      color: "#F59E0B",
      title: "Zero-Knowledge Privacy",
      description:
        "Loan amounts, collateral, and credit tiers are encrypted in private records. Only involved parties can view details — the public chain sees nothing sensitive.",
    },
    {
      icon: <GradeIcon />,
      color: "#8B5CF6",
      title: "On-Chain Credit Tiers",
      description:
        "v8 enforces credit tier eligibility on-chain. Tier 1 requires ≥1 repayment, Tier 2 requires ≥3. No more self-asserted tiers.",
    },
    {
      icon: <TrendingIcon />,
      color: "#10b981",
      title: "Time-Based Interest",
      description:
        "Interest is proportional to elapsed blocks — repay early and pay less. Partial payments are accepted; the loan stays active until fully cleared.",
    },
    {
      icon: <SwapIcon />,
      color: "#06b6d4",
      title: "Built-in Swaps",
      description:
        "Swap between ALEO microcredits and USDCx directly in the app at a 1:1 testnet rate, no external DEX needed.",
    },
  ];

  const steps = [
    {
      number: 1,
      icon: <ShieldIcon />,
      color: "#F59E0B",
      title: "Create Credit Tier",
      description:
        "Generate a private ZK credit tier record (0, 1, or 2). Tier upgrades require verified on-chain repayment history.",
    },
    {
      number: 2,
      icon: <LockIcon />,
      color: "#8B5CF6",
      title: "Open Loan",
      description:
        "Set terms: principal (USDCx), collateral (≥150% in µALEO), interest rate (bps), and duration. Collateral is locked atomically.",
    },
    {
      number: 3,
      icon: <ReceiptIcon />,
      color: "#10b981",
      title: "Fund Borrower",
      description:
        "Lender sends exactly the agreed USDCx principal. v6 verifies the amount on-chain — under/over-funding is rejected.",
    },
    {
      number: 4,
      icon: <CheckIcon />,
      color: "#06b6d4",
      title: "Repay & Reclaim",
      description:
        "Make full or partial payments. Time-based interest accrues per block. Collateral releases automatically on full repayment.",
    },
  ];

  const records = [
    {
      name: "CreditTier",
      color: "#F59E0B",
      description: "Private ZK credit credential — tier enforced on-chain",
      fields: ["owner: address", "tier: u8  // 0 | 1 | 2", "nonce: field"],
    },
    {
      name: "Loan",
      color: "#8B5CF6",
      description: "Encrypted loan record with all terms (v8)",
      fields: [
        "owner: address",
        "lender: address",
        "loan_id: u32",
        "principal: u128",
        "collateral: u64",
        "interest_bps: u16",
        "start_block: u32",
        "duration_blocks: u32",
        "repaid: u128",
        "status: u8",
      ],
    },
    {
      name: "Collateral",
      color: "#10b981",
      description: "Locked collateral record with unlock height",
      fields: [
        "owner: address",
        "loan_id: u32",
        "amount: u64",
        "locked_until: u32",
      ],
    },
  ];

  const faqs = [
    {
      q: "What's new in v8?",
      a: "v8 Fixes four protocol bugs from Wave 4 judges: on-chain credit tier enforcement, fund_borrower amount verification, collateral privacy (bool instead of u64 in public mapping), and time-based interest with partial repayment support.",
    },
    {
      q: "How does time-based interest work?",
      a: "Interest = principal × bps × elapsed_blocks / (10000 × duration_blocks). Repay at 50% of the loan duration and you pay ~50% of the full interest — not the flat rate.",
    },
    {
      q: "Can I make partial payments?",
      a: "Yes. v8 accepts any payment > 0 as long as repaid + payment ≤ total_due. The loan stays active until fully cleared, then collateral is released.",
    },
    {
      q: "Why is collateral_locked now a bool?",
      a: "In v4, storing the exact u64 collateral amount publicly let observers infer the private principal (principal ≤ collateral / 1.5). v8 stores only true/false, preserving privacy.",
    },
    {
      q: "What wallets are supported?",
      a: "Puzzle, Leo, Shield, Fox, and Soter wallets on Aleo Testnet. Shield Wallet is recommended for best private record support.",
    },
    {
      q: "What happens if I miss repayment?",
      a: "After the deadline block, the lender can call liquidate() with the collateral amount. The collateral transfers to the lender and the loan closes.",
    },
  ];

  const mappings = [
    {
      name: "loan_active",
      type: "u32 → bool",
      desc: "Whether a loan is currently open",
    },
    {
      name: "loan_owner",
      type: "u32 → address",
      desc: "Borrower address per loan",
    },
    {
      name: "loan_lender",
      type: "u32 → address",
      desc: "Lender address per loan",
    },
    { name: "loan_deadline", type: "u32 → u32", desc: "Expiry block height" },
    {
      name: "collateral_locked",
      type: "u32 → bool",
      desc: "Presence flag only — no amount leaked (v8)",
    },
    {
      name: "loan_principal",
      type: "u32 → u128",
      desc: "Agreed principal for fund_borrower verification (v8)",
    },
    {
      name: "repayment_count",
      type: "address → u32",
      desc: "On-chain repayment history for tier enforcement (v8)",
    },
    {
      name: "loan_counter",
      type: "u32 → u32",
      desc: "Total loans ever created",
    },
  ];

  if (variant === "compact") {
    return (
      <Box>
        {showHeader && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h5"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                fontFamily: '"Orbitron", sans-serif',
              }}
            >
              Quick Docs
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              PrivLend v8 — private DeFi lending on Aleo with on-chain credit
              enforcement and time-based interest.
            </Typography>
          </Box>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 3, bgcolor: "#111827", borderRadius: 3, height: "100%" }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <TimelineIcon sx={{ color: "#F59E0B" }} /> How It Works
              </Typography>
              {steps.map((s) => (
                <StepCard key={s.number} {...s} />
              ))}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "white",
                  fontWeight: 700,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <InfoIcon sx={{ color: "#F59E0B" }} /> FAQs
              </Typography>
              {faqs.slice(0, 4).map((faq, i) => (
                <Accordion
                  key={i}
                  sx={{
                    bgcolor: "transparent",
                    boxShadow: "none",
                    "&:before": { display: "none" },
                    borderBottom:
                      i < 3 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: "#F59E0B" }} />}
                  >
                    <Typography
                      sx={{
                        color: "white",
                        fontWeight: 500,
                        fontSize: "0.9rem",
                      }}
                    >
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {faq.a}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero */}
      {showHeader && (
        <Box
          sx={{
            position: "relative",
            py: { xs: 4, md: 6 },
            mb: 4,
            borderRadius: 4,
            overflow: "hidden",
            background: "linear-gradient(135deg, #0F172A 0%, #1a1035 100%)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Box sx={{ textAlign: "center" }}>
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
                >
                  <ShieldIcon sx={{ fontSize: 56, color: "#F59E0B", mb: 2 }} />
                </motion.div>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    fontFamily: '"Orbitron", sans-serif',
                    background:
                      "linear-gradient(135deg, #F59E0B, #FBBF24, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    mb: 1,
                  }}
                >
                  PrivLend v8 Docs
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "rgba(255,255,255,0.65)", mb: 3 }}
                >
                  Private, trustless lending powered by zero-knowledge proofs on
                  Aleo
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {[
                    { label: "Leo 4.0", icon: <CodeIcon />, color: "warning" },
                    {
                      label: "On-Chain Credit Tiers",
                      icon: <GradeIcon />,
                      color: "primary",
                    },
                    {
                      label: "Time-Based Interest",
                      icon: <TrendingIcon />,
                      color: "success",
                    },
                    {
                      label: "Partial Repayments",
                      icon: <ReceiptIcon />,
                      color: "info",
                    },
                  ].map((c) => (
                    <Chip
                      key={c.label}
                      icon={c.icon}
                      label={c.label}
                      size="small"
                      sx={{
                        bgcolor: alpha(
                          theme.palette[c.color as "warning"].main,
                          0.12,
                        ),
                        color: `${c.color}.main`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 0 } }}>
        {/* Features */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 3,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "1.1rem",
          }}
        >
          Key Features
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((f, i) => (
            <Grid size={{ xs: 12, md: 6 }} key={i}>
              <FeatureCard {...f} delay={i * 0.1} />
            </Grid>
          ))}
        </Grid>

        {/* How It Works */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 3,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "1.1rem",
          }}
        >
          How It Works
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              sx={{ p: 3, bgcolor: "#111827", borderRadius: 3, height: "100%" }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: "white", fontWeight: 700, mb: 3 }}
              >
                Step-by-Step
              </Typography>
              {steps.map((s) => (
                <StepCard key={s.number} {...s} />
              ))}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: "white", fontWeight: 700, mb: 3 }}
              >
                Private Records (v8)
              </Typography>
              {records.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: alpha(r.color, 0.05),
                      border: `1px solid ${alpha(r.color, 0.2)}`,
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <VpnKeyIcon sx={{ color: r.color, fontSize: 18 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "monospace",
                        }}
                      >
                        record {r.name}
                      </Typography>
                      <Chip
                        label="private"
                        size="small"
                        sx={{
                          bgcolor: alpha(r.color, 0.15),
                          color: r.color,
                          fontSize: "0.65rem",
                          height: 18,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.45)",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {r.description}
                    </Typography>
                    <Box
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        color: "#94a3b8",
                        pl: 1,
                      }}
                    >
                      {r.fields.map((f, j) => (
                        <div key={j}>{f}</div>
                      ))}
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Public Mappings */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 3,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "1.1rem",
          }}
        >
          Public On-Chain Mappings
        </Typography>
        <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3, mb: 6 }}>
          <Grid container spacing={1.5}>
            {mappings.map((m, i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "rgba(245,158,11,0.04)",
                    border: "1px solid rgba(245,158,11,0.12)",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      color: "#F59E0B",
                      fontWeight: 700,
                    }}
                  >
                    {m.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.72rem",
                      color: "#64748b",
                    }}
                  >
                    {m.type}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {m.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Code Examples */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 3,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "1.1rem",
          }}
        >
          Example Transactions
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#10b981", mb: 2, fontFamily: "monospace" }}
              >
                // Open Loan (v8)
              </Typography>
              <CodeBlock
                code={`executeTransaction({
  program: "privlend_v8.aleo",
  function: "open_loan",
  inputs: [
    "1u32",                 // loan_id
    "100000u32",            // start_block
    "aleo1lender...",       // lender address
    "{credit_tier_record}", // private CreditTier
    "1000u128",             // principal (USDCx)
    "1500u64",              // collateral (µALEO, ≥150%)
    "500u16",               // interest_bps (5%)
    "43200u32"              // duration_blocks (~300 days)
  ],
  fee: 350_000
})`}
              />
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: "#F59E0B", mb: 2, fontFamily: "monospace" }}
              >
                // Repay Loan — partial payment (v8)
              </Typography>
              <CodeBlock
                code={`executeTransaction({
  program: "privlend_v8.aleo",
  function: "repay_loan",
  inputs: [
    "{loan_record}",  // private Loan record
    "500u128",        // payment (partial ok in v8)
    "100500u32"       // current_block (for time interest)
  ],
  fee: 300_000
})

// Interest = principal × bps × elapsed
//            / (10000 × duration_blocks)
// Repay early → pay less interest`}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* v8 Changes callout */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "#111827",
            borderRadius: 3,
            mb: 6,
            border: "1px solid rgba(139,92,246,0.25)",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 2,
              fontFamily: '"Orbitron", sans-serif',
              fontSize: "1rem",
            }}
          >
            What Changed in v8
          </Typography>
          <Grid container spacing={2}>
            {[
              {
                color: "#F59E0B",
                label: "Credit Tier Enforcement",
                desc: "Tier 1 requires ≥1 repayment, Tier 2 requires ≥3. Checked on-chain via repayment_count mapping.",
              },
              {
                color: "#8B5CF6",
                label: "Fund Amount Verification",
                desc: "fund_borrower now asserts amount == loan_principal.get(loan_id). Under/over-funding is rejected.",
              },
              {
                color: "#10b981",
                label: "Collateral Privacy Fix",
                desc: "collateral_locked changed from u64 → bool. Observers can no longer infer the private principal.",
              },
              {
                color: "#06b6d4",
                label: "Time-Based Interest + Partial Pay",
                desc: "Interest accrues per block. Partial payments accepted; loan stays active until fully cleared.",
              },
            ].map((item, i) => (
              <Grid size={{ xs: 12, md: 6 }} key={i}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(item.color, 0.06),
                    border: `1px solid ${alpha(item.color, 0.2)}`,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: item.color,
                      mt: 0.7,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: item.color, fontWeight: 700, mb: 0.3 }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.55)" }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Token Info */}
        <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3, mb: 6 }}>
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 2,
              fontFamily: '"Orbitron", sans-serif',
              fontSize: "1rem",
            }}
          >
            Token System
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: alpha("#10b981", 0.08),
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <BalanceIcon sx={{ color: "#10b981", fontSize: 36, mb: 1 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#10b981",
                      fontFamily: '"Orbitron", sans-serif',
                      fontSize: "0.9rem",
                    }}
                  >
                    USDCx
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}
                  >
                    Stablecoin used for principal and repayments. u128
                    precision. Obtained via the built-in swap or testnet faucet.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{
                  bgcolor: alpha("#F59E0B", 0.08),
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <BalanceIcon sx={{ color: "#F59E0B", fontSize: 36, mb: 1 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      color: "#F59E0B",
                      fontFamily: '"Orbitron", sans-serif',
                      fontSize: "0.9rem",
                    }}
                  >
                    Microcredits (µALEO)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}
                  >
                    Native Aleo token used as collateral. Minimum 150% of
                    principal value. u64 precision. Get from the Aleo testnet
                    faucet.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* FAQs */}
        <Typography
          variant="h5"
          sx={{
            color: "white",
            fontWeight: 700,
            mb: 3,
            fontFamily: '"Orbitron", sans-serif',
            fontSize: "1.1rem",
          }}
        >
          FAQs
        </Typography>
        <Paper sx={{ p: 3, bgcolor: "#111827", borderRadius: 3, mb: 6 }}>
          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              sx={{
                bgcolor: "transparent",
                boxShadow: "none",
                "&:before": { display: "none" },
                borderBottom:
                  i < faqs.length - 1
                    ? "1px solid rgba(255,255,255,0.07)"
                    : "none",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "#F59E0B" }} />}
              >
                <Typography
                  sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem" }}
                >
                  {faq.q}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: "0.875rem",
                    lineHeight: 1.7,
                  }}
                >
                  {faq.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>

        {/* CTA */}
        <Paper
          sx={{
            p: 4,
            bgcolor: "#111827",
            borderRadius: 3,
            textAlign: "center",
            border: "1px solid rgba(245,158,11,0.15)",
          }}
        >
          <CelebrationIcon sx={{ fontSize: 44, color: "#F59E0B", mb: 2 }} />
          <Typography
            variant="h6"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 1,
              fontFamily: '"Orbitron", sans-serif',
              fontSize: "1rem",
            }}
          >
            Ready to try PrivLend v8?
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(255,255,255,0.55)", mb: 3 }}
          >
            Connect your wallet, create a credit tier, and start borrowing
            privately on Aleo Testnet.
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              size="small"
              href="https://developer.aleo.org"
              target="_blank"
              startIcon={<KeyIcon />}
              sx={{
                background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                color: "#0F172A",
                fontWeight: 700,
              }}
            >
              Aleo Docs
            </Button>
            <Button
              variant="outlined"
              size="small"
              href="https://faucet.aleo.org/"
              target="_blank"
              startIcon={<WalletIcon />}
              sx={{
                borderColor: "rgba(245,158,11,0.4)",
                color: "#FBBF24",
                "&:hover": { borderColor: "#F59E0B" },
              }}
            >
              Get Testnet Tokens
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Docs;
