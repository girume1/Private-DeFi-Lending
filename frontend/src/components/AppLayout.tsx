import React, { useMemo } from 'react';
import {
  Box,
  CssBaseline,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Chip
} from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { useWalletModal } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  const { connected, address, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const displayName = useMemo(() => {
    if (!address) return "";

    const savedProfile = localStorage.getItem(`profile_${address}`);

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.username) return parsed.username;
      } catch {}
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#020617' }}>
      <CssBaseline />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            background: '#0f172a',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'none'
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }} />

            {!connected ? (
              <Button
                variant="contained"
                onClick={() => setVisible(true)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                Connect Wallet
              </Button>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center'
                }}
              >
                {/*  Username / Address */}
                <Chip
                  label={displayName}
                  sx={{
                    px: 1,
                    fontWeight: 600,
                    background:
                      'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
                    border: '1px solid rgba(99,102,241,0.4)',
                    color: '#818cf8'
                  }}
                />

                <Button
                  color="error"
                  onClick={disconnect}
                  sx={{ fontWeight: 600 }}
                >
                  Disconnect
                </Button>
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