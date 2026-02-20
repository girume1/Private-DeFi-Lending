import React, { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Add as AddIcon, AssignmentTurnedIn as TierIcon } from '@mui/icons-material';
import { LoanCreationForm } from '../components/LoanCreationForm';
import { CreditTierCreator } from '../components/CreditTierCreator';
import { usePrivLend } from '../context/PrivLendContext';

export const Borrow: React.FC = () => {
    const { refreshData } = usePrivLend();
    const [showTierModal, setShowTierModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>Borrow Capital</Typography>
            
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
                <Paper sx={{ p: 4, flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowTierModal(true)}>
                    <TierIcon sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6">1. Create Credit Tier</Typography>
                    <Typography variant="body2" color="text.secondary">Prove your creditworthiness privately</Typography>
                </Paper>

                <Paper sx={{ p: 4, flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowLoanModal(true)}>
                    <AddIcon sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6">2. Create Loan</Typography>
                    <Typography variant="body2" color="text.secondary">Request funds using your private proof</Typography>
                </Paper>
            </Box>

            <CreditTierCreator open={showTierModal} onClose={() => setShowTierModal(false)} onSuccess={refreshData} />
            {/* ... Modal for LoanCreationForm ... */}
        </Box>
    );
};