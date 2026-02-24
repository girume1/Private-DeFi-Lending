import React, { useState, useMemo } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TablePagination,
  TableSortLabel,
  TextField,
  InputAdornment,
  Stack,
  Button,
  Tooltip,
  Avatar,
  alpha,
  useTheme,
  MenuItem
} from '@mui/material';
import {
  Launch as LaunchIcon,
  CheckCircle as SuccessIcon,
  Pending as PendingIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  AccountBalance as LoanIcon,
  Grade as TierIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrivLend } from '../context/PrivLendContext';
import { formatDistanceToNow } from 'date-fns';

export const History: React.FC = () => {
  const theme = useTheme();
  const { transactionHistory, refreshData } = usePrivLend();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<'timestamp' | 'type'>('timestamp');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  const getStatusChip = (status: string) => {
    const configs = {
      Completed: { icon: SuccessIcon, color: 'success', label: 'Completed' },
      Pending: { icon: PendingIcon, color: 'warning', label: 'Processing' },
      Failed: { icon: ErrorIcon, color: 'error', label: 'Failed' }
    };
    
    const config = configs[status as keyof typeof configs] || { 
      icon: PendingIcon, 
      color: 'default', 
      label: status 
    };
    
    return (
      <Chip
        icon={<config.icon />}
        label={config.label}
        color={config.color as any}
        variant="outlined"
        size="small"
        sx={{ minWidth: 100 }}
      />
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Create Credit Tier': <TierIcon sx={{ color: '#6366f1' }} />,
      'Create Loan': <LoanIcon sx={{ color: '#10b981' }} />,
      'Repay Loan': <ReceiptIcon sx={{ color: '#f59e0b' }} />,
      'Liquidate': <WarningIcon sx={{ color: '#ef4444' }} />
    };
    return icons[type] || <ReceiptIcon sx={{ color: '#94a3b8' }} />;
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactionHistory;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (orderBy === 'timestamp') {
        return orderDirection === 'desc' 
          ? b.timestamp - a.timestamp
          : a.timestamp - b.timestamp;
      }
      return 0;
    });

    return filtered;
  }, [transactionHistory, searchTerm, filterType, orderBy, orderDirection]);

  // Get unique transaction types for filter
  const transactionTypes = ['all', ...new Set(transactionHistory.map(tx => tx.type))];

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: 'timestamp' | 'type') => {
    const isAsc = orderBy === property && orderDirection === 'asc';
    setOrderDirection(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Activity History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track all your transactions on the PrivLend protocol
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={refreshData} sx={{ color: '#6366f1' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Summary */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#0f172a', borderRadius: 3 }}>
        <Stack direction="row" spacing={3} divider={<Box sx={{ width: 1, height: 20, bgcolor: 'divider' }} />}>
          <Box>
            <Typography variant="body2" color="text.secondary">Total Transactions</Typography>
            <Typography variant="h6" sx={{ color: 'white' }}>{transactionHistory.length}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Successful</Typography>
            <Typography variant="h6" sx={{ color: '#10b981' }}>
              {transactionHistory.filter(tx => tx.status === 'Completed').length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
            <Typography variant="h6" sx={{ color: '#f59e0b' }}>
              {transactionHistory.filter(tx => tx.status === 'Pending').length}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#0f172a', borderRadius: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by transaction ID or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#6366f1' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 2 }}
          />
          <TextField
            select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterIcon sx={{ color: '#6366f1' }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          >
            {transactionTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Transactions Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timestamp'}
                  direction={orderBy === 'timestamp' ? orderDirection : 'asc'}
                  onClick={() => handleRequestSort('timestamp')}
                >
                  Time
                </TableSortLabel>
              </TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Explorer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence mode="wait">
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchTerm ? 'Try adjusting your search' : 'Your transaction history will appear here'}
                      </Typography>
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((tx, index) => (
                    <TableRow 
                      key={tx.id}
                      component={motion.tr}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white' }}>
                            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(tx.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#6366f1', 0.1) }}>
                            {getTypeIcon(tx.type)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {tx.type}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontFamily: 'monospace',
                            color: 'rgba(255,255,255,0.7)'
                          }}
                        >
                          {`${tx.id.slice(0, 8)}...${tx.id.slice(-6)}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(tx.status)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View on Explorer">
                          <IconButton
                            href={`https://explorer.provable.com/transaction/${tx.id}`}
                            target="_blank"
                            sx={{ 
                              color: '#6366f1',
                              '&:hover': { bgcolor: alpha('#6366f1', 0.1) }
                            }}
                          >
                            <LaunchIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredTransactions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: 'white',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}
        />
      </TableContainer>
    </Box>
  );
};