import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Alert,
  AlertTitle,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Pagination,
  SelectChangeEvent,
  alpha,
  Paper,
  Button
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, Sort as SortIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivLend } from '../context/PrivLendContext';
import { LoanCard } from '../components/LoanCard';

export const Markets: React.FC = () => {
  const { allPublicLoans, currentBlock, refreshData, loading } = usePrivLend();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'id'>('deadline');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Filter and sort loans
  const processedLoans = useMemo(() => {
    // First, separate expired and active
    const expired = allPublicLoans.filter(loan => loan.active && currentBlock > loan.deadline);
    const active = allPublicLoans.filter(loan => loan.active && currentBlock <= loan.deadline);
    const settled = allPublicLoans.filter(loan => !loan.active);

    let filtered = [];
    
    switch (filterBy) {
      case 'active':
        filtered = active;
        break;
      case 'expired':
        filtered = expired;
        break;
      default:
        filtered = [...expired, ...active, ...settled];
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(loan => 
        loan.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.loan_id.toString().includes(searchTerm)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'deadline') {
        return a.deadline - b.deadline;
      } else {
        return a.loan_id - b.loan_id;
      }
    });

    return filtered;
  }, [allPublicLoans, currentBlock, searchTerm, filterBy, sortBy]);

  // Pagination
  const pageCount = Math.ceil(processedLoans.length / itemsPerPage);
  const displayedLoans = processedLoans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const expiredCount = allPublicLoans.filter(loan => loan.active && currentBlock > loan.deadline).length;
  const activeCount = allPublicLoans.filter(loan => loan.active && currentBlock <= loan.deadline).length;
  const settledCount = allPublicLoans.filter(loan => !loan.active).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Global Loan Markets
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and participate in private lending opportunities
        </Typography>
      </Box>

      {/* Stats Chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip 
          label={`Total: ${allPublicLoans.length}`} 
          color="default"
          sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}
        />
        <Chip 
          label={`Active: ${activeCount}`} 
          color="success"
          sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}
        />
        <Chip 
          label={`Expired: ${expiredCount}`} 
          color="error"
          sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}
        />
        <Chip 
          label={`Settled: ${settledCount}`} 
          color="default"
          sx={{ bgcolor: alpha('#94a3b8', 0.1), color: '#94a3b8' }}
        />
      </Stack>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: '#0f172a', borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by loan ID or borrower address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#6366f1' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#1e293b',
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterBy}
                label="Filter"
                onChange={(e: SelectChangeEvent) => setFilterBy(e.target.value as any)}
                startAdornment={<FilterIcon sx={{ mr: 1, color: '#6366f1' }} />}
              >
                <MenuItem value="all">All Loans</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="expired">Expired Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e: SelectChangeEvent) => setSortBy(e.target.value as any)}
                startAdornment={<SortIcon sx={{ mr: 1, color: '#6366f1' }} />}
              >
                <MenuItem value="deadline">Deadline (Soonest first)</MenuItem>
                <MenuItem value="id">Loan ID (Newest first)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Liquidation Alert */}
      {expiredCount > 0 && filterBy !== 'active' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert 
            severity="warning" 
            sx={{ mb: 4, borderRadius: 3 }}
            action={
              <Button color="warning" size="small" onClick={() => setFilterBy('expired')}>
                View All
              </Button>
            }
          >
            <AlertTitle>⚠️ Liquidation Opportunities Available</AlertTitle>
            There {expiredCount === 1 ? 'is' : 'are'} <strong>{expiredCount}</strong> loan{expiredCount !== 1 ? 's' : ''} eligible for liquidation.
          </Alert>
        </motion.div>
      )}

      {/* Loans Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box className="spinner" />
        </Box>
      ) : (
        <AnimatePresence mode="wait">
          {displayedLoans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#0f172a', borderRadius: 4 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No loans found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ? 'Try adjusting your search or filters' : 'Check back later for new lending opportunities'}
                </Typography>
              </Paper>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Grid container spacing={3}>
                {displayedLoans.map((loan, index) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={loan.loan_id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <LoanCard loan={loan} onUpdate={refreshData} />
                    </motion.div>
                  </Grid>
                ))}
              </Grid>

              {pageCount > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pageCount}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: 'white',
                      }
                    }}
                  />
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Box>
  );
};