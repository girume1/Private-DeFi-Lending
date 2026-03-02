import React from 'react';
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
  Divider
} from '@mui/material';
import {
  Lock as LockIcon,
  VisibilityOff as PrivacyIcon,
  ReceiptLong as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Science as ScienceIcon,
  Timeline as TimelineIcon,
  Shield as ShieldIcon,
  AccountBalance as BalanceIcon,
  SwapHoriz as SwapIcon,
  Rocket as RocketIcon,
  AutoGraph as GraphIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface DocsProps {
  variant?: 'full' | 'compact';
  showHeader?: boolean;
}

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  delay: number 
}> = ({ icon, title, description, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -8 }}
  >
    <Paper
      sx={{
        p: 3,
        height: '100%',
        background: `linear-gradient(145deg, ${alpha(color, 0.15)}, ${alpha(color, 0.05)})`,
        border: `1px solid ${alpha(color, 0.2)}`,
        borderRadius: 4,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: color,
          boxShadow: `0 20px 40px ${alpha(color, 0.2)}`
        }
      }}
    >
      <Box sx={{ color, mb: 2, fontSize: '2.5rem' }}>
        {icon}
      </Box>
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
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
}> = ({ number, title, description, icon, color }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: number * 0.1 }}
    >
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            bgcolor: alpha(color, 0.2),
            color,
            width: 48,
            height: 48,
            border: `2px solid ${color}`
          }}
        >
          {icon}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
            {number}. {title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            {description}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'leo' }) => (
  <Paper
    sx={{
      p: 2,
      bgcolor: '#020617',
      border: '1px solid #1e293b',
      borderRadius: 2,
      overflow: 'auto'
    }}
  >
    <Typography
      component="pre"
      sx={{
        color: '#94a3b8',
        fontFamily: 'monospace',
        fontSize: '0.85rem',
        lineHeight: 1.8,
        m: 0
      }}
    >
      {code}
    </Typography>
  </Paper>
);

export const Docs: React.FC<DocsProps> = ({ variant = 'full', showHeader = true }) => {
  const theme = useTheme();

  const features = [
    {
      icon: <PrivacyIcon />,
      title: "Zero-Knowledge Privacy",
      description: "All loan amounts, collateral values, and credit scores are encrypted. Only involved parties can view details.",
      color: '#6366f1'
    },
    {
      icon: <SecurityIcon />,
      title: "Trustless Execution",
      description: "Smart contracts automatically handle liquidation and collateral release based on verified conditions.",
      color: '#10b981'
    },
    {
      icon: <SpeedIcon />,
      title: "Lightning Fast",
      description: "Leverage Aleo's zero-knowledge proofs for instant verification without compromising privacy.",
      color: '#f59e0b'
    },
    {
      icon: <BalanceIcon />,
      title: "Flexible Terms",
      description: "Customize loan duration, interest rates, and collateral ratios. Create terms that work for you.",
      color: '#8b5cf6'
    }
  ];

  const steps = [
    {
      number: 1,
      title: "Create Credit Tier",
      description: "Generate a private credit profile using zero-knowledge proofs. Select your tier (A, B, or C) and receive a private record.",
      icon: <ShieldIcon />,
      color: '#6366f1'
    },
    {
      number: 2,
      title: "Initialize Loan",
      description: "Create an encrypted loan with lender address, principal, collateral, interest rate, and duration. Minimum 150% collateral required.",
      icon: <SwapIcon />,
      color: '#10b981'
    },
    {
      number: 3,
      title: "Public Registration",
      description: "Register loan publicly without revealing amounts. Only loan ID, owner, deadline, and active status are public.",
      icon: <ReceiptIcon />,
      color: '#f59e0b'
    },
    {
      number: 4,
      title: "Repayment & Settlement",
      description: "Repay privately using your loan record. Collateral automatically unlocks upon full repayment.",
      icon: <CheckIcon />,
      color: '#8b5cf6'
    }
  ];

  const records = [
    {
      name: "CreditTier",
      description: "Private credit profile with ZK-proof",
      fields: ["owner: address", "tier: u8", "nonce: field"],
      color: '#6366f1'
    },
    {
      name: "Loan",
      description: "Encrypted loan with all terms",
      fields: ["owner: address", "lender: address", "loan_id: u32", "principal: u64", "collateral: u64", "interest_bps: u16"],
      color: '#10b981'
    },
    {
      name: "Collateral",
      description: "Locked assets with ownership proof",
      fields: ["owner: address", "loan_id: u32", "amount: u64", "locked_until: u32"],
      color: '#f59e0b'
    }
  ];

  const quickFaqs = [
    {
      q: "What wallets are supported?",
      a: "Puzzle Wallet, Leo Wallet, Fox Wallet, Shield Wallet, and Soter Wallet on Aleo Testnet."
    },
    {
      q: "Is my data really private?",
      a: "Yes! All sensitive data (amounts, credit tiers) are encrypted in private records. Only public mappings track loan existence."
    },
    {
      q: "What happens if I miss repayment?",
      a: "After the deadline block passes, anyone can liquidate the loan. The collateral is transferred to the lender."
    }
  ];

  if (variant === 'compact') {
    return (
      <Box>
        {showHeader && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
              📚 Quick Documentation
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Everything you need to know about PrivLend
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon sx={{ color: '#6366f1' }} />
                Quick Steps
              </Typography>
              {steps.map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon sx={{ color: '#f59e0b' }} />
                FAQs
              </Typography>
              {quickFaqs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    bgcolor: 'transparent',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    borderBottom: index < quickFaqs.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}>
                    <Typography sx={{ color: 'white', fontWeight: 500 }}>{faq.q}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{faq.a}</Typography>
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
      {/* Hero Section */}
      {showHeader && (
        <Box
          sx={{
            position: 'relative',
            py: { xs: 4, md: 6 },
            mb: 4,
            borderRadius: 4,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid rgba(99,102,241,0.2)'
          }}
        >
          <Container maxWidth="lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                >
                  <ShieldIcon sx={{ fontSize: 60, color: '#6366f1', mb: 2 }} />
                </motion.div>
                
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #fff, #818cf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  PrivLend Protocol Docs
                </Typography>
                
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                  Private, trustless lending powered by zero-knowledge proofs on Aleo
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip icon={<ScienceIcon />} label="Testnet v1.0" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: 'warning.main' }} />
                  <Chip icon={<CodeIcon />} label="Open Source" size="small" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main' }} />
                  <Chip icon={<SecurityIcon />} label="ZK-Powered" size="small" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main' }} />
                </Box>
              </Box>
            </motion.div>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 0 } }}>
        {/* Features Grid */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
          ✨ Key Features
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <FeatureCard {...feature} delay={index * 0.1} />
            </Grid>
          ))}
        </Grid>

        {/* How It Works */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
          🔄 How It Works
        </Typography>
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3, height: '100%' }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                Step-by-Step Guide
              </Typography>
              {steps.map((step) => (
                <StepCard key={step.number} {...step} />
              ))}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
                Private Records Structure
              </Typography>
              {records.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: alpha(record.color, 0.05),
                      border: `1px solid ${alpha(record.color, 0.2)}`,
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <VpnKeyIcon sx={{ color: record.color, fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                        record {record.name}
                      </Typography>
                      <Chip label="private" size="small" sx={{ bgcolor: alpha(record.color, 0.2), color: record.color, fontSize: '0.7rem' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 1 }}>
                      {record.description}
                    </Typography>
                    <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
                      {record.fields.map((field, i) => (
                        <div key={i} style={{ paddingLeft: '10px' }}>{field}</div>
                      ))}
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Paper>
          </Grid>
        </Grid>

        {/* Code Example */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 3 }}>
          💻 Example Transaction
        </Typography>
        <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3, mb: 6 }}>
          <CodeBlock code={`// Create a private loan with 1000 ALEO principal, 1500 ALEO collateral
executeTransaction({
  program: "privlend.aleo",
  function: "create_loan_private",
  inputs: [
    "1u32",                    // loan_id
    "100000u32",               // current_block
    "aleo1...",                // lender address
    "{credit_tier_record}",    // private credit tier
    "1000u64",                 // principal
    "1500u64",                 // collateral
    "500u16",                  // interest (5% = 500 bps)
    "43200u32"                 // duration (300 days)
  ],
  fee: 250000
})`} />
        </Paper>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, bgcolor: '#0f172a', borderRadius: 3, textAlign: 'center' }}>
          <CelebrationIcon sx={{ fontSize: 48, color: '#6366f1', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            Ready to start?
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Connect your wallet and create your first credit tier
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="small"
              href="https://aleo.org"
              target="_blank"
              startIcon={<KeyIcon />}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Aleo Docs
            </Button>
            <Button
              variant="outlined"
              size="small"
              href="https://faucet.aleo.org/"
              target="_blank"
              startIcon={<WalletIcon />}
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