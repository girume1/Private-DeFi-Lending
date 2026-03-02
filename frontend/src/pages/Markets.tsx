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
import { Search as SearchIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivLend } from '../context/PrivLendContext';
import { LoanCard } from '../components/LoanCard';

export const Markets: React.FC = () => {
  const { allPublicLoans, currentBlock, refreshData, loading } =
    usePrivLend();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] =
    useState<'all' | 'active' | 'expired'>('all');
  const [sortBy, setSortBy] =
    useState<'deadline' | 'id'>('deadline');

  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const expired = useMemo(
    () =>
      allPublicLoans.filter(
        loan => loan.active && currentBlock > loan.deadline
      ),
    [allPublicLoans, currentBlock]
  );

  const active = useMemo(
    () =>
      allPublicLoans.filter(
        loan => loan.active && currentBlock <= loan.deadline
      ),
    [allPublicLoans, currentBlock]
  );

  const settled = useMemo(
    () => allPublicLoans.filter(loan => !loan.active),
    [allPublicLoans]
  );

  const processedLoans = useMemo(() => {
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

    if (searchTerm) {
      filtered = filtered.filter(
        loan =>
          loan.owner
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          loan.loan_id.toString().includes(searchTerm)
      );
    }

    filtered.sort((a, b) =>
      sortBy === 'deadline'
        ? a.deadline - b.deadline
        : b.loan_id - a.loan_id
    );

    return filtered;
  }, [active, expired, settled, filterBy, searchTerm, sortBy]);

  const pageCount = Math.ceil(
    processedLoans.length / itemsPerPage
  );

  const displayedLoans = processedLoans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Global Loan Markets
      </Typography>

      <Stack direction="row" spacing={2} mb={3}>
        <Chip label={`Total: ${allPublicLoans.length}`} />
        <Chip label={`Active: ${active.length}`} />
        <Chip label={`Expired: ${expired.length}`} />
      </Stack>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={e =>
                setSearchTerm(e.target.value)
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter</InputLabel>
              <Select
                value={filterBy}
                label="Filter"
                onChange={(e: SelectChangeEvent) =>
                  setFilterBy(e.target.value as any)
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort</InputLabel>
              <Select
                value={sortBy}
                label="Sort"
                onChange={(e: SelectChangeEvent) =>
                  setSortBy(e.target.value as any)
                }
              >
                <MenuItem value="deadline">
                  Deadline
                </MenuItem>
                <MenuItem value="id">
                  Newest
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {expired.length > 0 && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <AlertTitle>
            Liquidation Opportunities
          </AlertTitle>
          {expired.length} loan(s) eligible.
        </Alert>
      )}

      {loading ? (
        <Box textAlign="center" py={8}>
          Loading...
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {displayedLoans.map((loan, index) => (
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                  lg: 4
                }}
                key={loan.loan_id}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <LoanCard
                    loan={loan}
                    onUpdate={refreshData}
                  />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Box
              display="flex"
              justifyContent="center"
              mt={4}
            >
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) =>
                  setPage(value)
                }
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};