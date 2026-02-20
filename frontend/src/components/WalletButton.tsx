import React from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletMultiButton } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { Box, Chip } from '@mui/material';
import { motion } from 'framer-motion';

export const WalletButton: React.FC = () => {
  const { connected, address } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {connected && address && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Chip
            label={formatAddress(address)}
            size="small"
            color="success"
            variant="outlined"
            sx={{ 
              borderColor: '#10b981',
              color: '#10b981',
              '& .MuiChip-label': { fontWeight: 500 }
            }}
          />
        </motion.div>
      )}
      <WalletMultiButton />
    </Box>
  );
};