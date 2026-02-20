import React from 'react';
import { Box, CssBaseline, Container, AppBar, Toolbar, Typography, Button, Chip } from '@mui/material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
    const { connected, address, disconnect } = useWallet();
    const { setVisible } = useWalletModal();

    const shortenedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#020617' }}>
            <CssBaseline />
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <AppBar position="sticky" sx={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1 }} />
                        {!connected ? (
                            <Button variant="contained" onClick={() => setVisible(true)} sx={{ borderRadius: 2 }}>
                                Connect Wallet
                            </Button>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Chip label={shortenedAddress} variant="outlined" sx={{ color: 'white' }} />
                                <Button color="error" onClick={disconnect}>Disconnect</Button>
                            </Box>
                        )}
                    </Toolbar>
                </AppBar>
                <Container maxWidth="xl" sx={{ mt: 4, pb: 4 }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};