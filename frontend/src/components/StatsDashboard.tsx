import React, { useMemo } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  ShowChart as ChartIcon,
  AccountBalance as LoanIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usePrivLend } from '../context/PrivLendContext';
import CountUp from 'react-countup';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  suffix = ''
}) => (
  <motion.div whileHover={{ y: -5 }}>
    <Paper
      sx={{
        p: 3,
        background: `linear-gradient(135deg, ${color}20, ${color}05)`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        height: '100%'
      }}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        <Box sx={{ color }}>{icon}</Box>
      </Box>

      <Typography variant="h3" fontWeight="bold" sx={{ color }}>
        <CountUp end={value} duration={1.5} />
        {suffix}
      </Typography>
    </Paper>
  </motion.div>
);

export const StatsDashboard: React.FC = () => {
  const { stats, currentBlock, allPublicLoans } = usePrivLend();

  const liquidationRisk = useMemo(() => {
    const activeLoans = allPublicLoans.filter(l => l.active);
    if (activeLoans.length === 0) return 0;

    const expired = activeLoans.filter(
      l => currentBlock > l.deadline
    ).length;

    return Math.round(
      (expired / activeLoans.length) * 100
    );
  }, [allPublicLoans, currentBlock]);

  const statCards = [
    {
      title: 'Total Loans',
      value: stats.totalLoans,
      icon: <LoanIcon sx={{ fontSize: 40 }} />,
      color: '#6366f1'
    },
    {
      title: 'Active Loans',
      value: stats.activeLoans,
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      color: '#10b981'
    },
    {
      title: 'Liquidation Risk',
      value: liquidationRisk,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: '#ef4444',
      suffix: '%'
    },
    {
      title: 'Current Block',
      value: currentBlock,
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: '#8b5cf6'
    },
    {
      title: 'Avg Interest',
      value: stats.avgInterestRate,
      icon: <ChartIcon sx={{ fontSize: 40 }} />,
      color: '#f59e0b',
      suffix: '%'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};