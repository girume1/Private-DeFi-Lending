import React from 'react';
import { Typography, Box, Alert, AlertTitle } from '@mui/material';
import { Grid } from '@mui/material';
import { usePrivLend } from '../context/PrivLendContext';
import { LoanCard } from '../components/LoanCard';

export const Markets: React.FC = () => {
    const { allPublicLoans, currentBlock, refreshData } = usePrivLend();

    const expiredLoans = allPublicLoans.filter(loan => loan.active && currentBlock > loan.deadline);
    const activeLoans = allPublicLoans.filter(loan => loan.active && currentBlock <= loan.deadline);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Global Loan Markets</Typography>

            {expiredLoans.length > 0 && (
                <Box sx={{ mb: 6 }}>
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
                        <AlertTitle>Liquidation Opportunities</AlertTitle>
                        There are {expiredLoans.length} loans currently eligible for liquidation.
                    </Alert>
                    <Grid container spacing={3}>
                        {expiredLoans.map(loan => (
                            <Grid size={{ xs: 12, md: 4 }} key={loan.loan_id}>
                                <LoanCard loan={loan} onUpdate={refreshData} />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <Typography variant="h6" sx={{ mb: 3 }}>Active Loans</Typography>
            <Grid container spacing={3}>
                {activeLoans.map(loan => (
                    <Grid size={{ xs: 12, md: 4 }} key={loan.loan_id}>
                        <LoanCard loan={loan} onUpdate={refreshData} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};