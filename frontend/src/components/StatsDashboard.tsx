import React from 'react';
import { Grid, Paper, Typography, Box, useTheme } from '@mui/material';
import {
  ShowChart as ChartIcon,
  AccountBalance as LoanIcon,
  TrendingUp as TrendingIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usePrivLend } from '../context/PrivLendContext';
import CountUp from 'react-countup';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, prefix = '', suffix = '' }) => {
  const theme = useTheme();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Paper
        sx={{
          p: 3,
          background: `linear-gradient(135deg, ${color}20, ${color}05)`,
          border: `1px solid ${color}40`,
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          height: '100%',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color, fontSize: '2rem' }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 'bold', color }}>
          {prefix}
          <CountUp end={Number(value)} duration={2} separator="," />
          {suffix}
        </Typography>
      </Paper>
    </motion.div>
  );
};

export const StatsDashboard: React.FC = () => {
  const { stats, currentBlock } = usePrivLend();

  const statCards = [
    {
      title: "Total Loans",
      value: stats.totalLoans,
      icon: <LoanIcon sx={{ fontSize: 40 }} />,
      color: "#6366f1"
    },
    {
      title: "Active Loans",
      value: stats.activeLoans,
      icon: <TrendingIcon sx={{ fontSize: 40 }} />,
      color: "#10b981"
    },
    {
      title: "Avg Interest",
      value: stats.avgInterestRate,
      icon: <ChartIcon sx={{ fontSize: 40 }} />,
      color: "#f59e0b",
      suffix: "%"
    },
    {
      title: "Current Block",
      value: currentBlock,
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      color: "#8b5cf6"
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <StatCard {...stat} />
        </Grid>
      ))}
    </Grid>
  );
};