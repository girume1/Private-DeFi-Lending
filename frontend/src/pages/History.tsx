import React from 'react';
import { 
  Typography, Box, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton 
} from '@mui/material';
import { Launch as LaunchIcon, CheckCircle as SuccessIcon, Pending as PendingIcon } from '@mui/icons-material';
import { usePrivLend } from '../context/PrivLendContext';

export const History: React.FC = () => {
  const { transactionHistory } = usePrivLend(); // Assume your context stores a list of past TXs

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Completed': return <Chip icon={<SuccessIcon />} label="Completed" color="success" variant="outlined" />;
      case 'Pending': return <Chip icon={<PendingIcon />} label="Processing" color="warning" variant="outlined" />;
      default: return <Chip label={status} variant="outlined" />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Activity History</Typography>
      
      <TableContainer component={Paper} sx={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: 'text.secondary' }}>Action</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Transaction ID</TableCell>
              <TableCell sx={{ color: 'text.secondary' }}>Status</TableCell>
              <TableCell sx={{ color: 'text.secondary' }} align="right">Explorer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactionHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>No transactions found.</TableCell>
              </TableRow>
            ) : (
              transactionHistory.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{tx.type}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', opacity: 0.7 }}>
                    {`${tx.id.slice(0, 10)}...${tx.id.slice(-8)}`}
                  </TableCell>
                  <TableCell>{getStatusChip(tx.status)}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      href={`https://explorer.provable.com/transaction/${tx.id}`} 
                      target="_blank"
                      sx={{ color: '#6366f1' }}
                    >
                      <LaunchIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};