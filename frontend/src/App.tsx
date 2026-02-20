import React, { useMemo } from 'react';
import { AleoWalletProvider } from '@provablehq/aleo-wallet-adaptor-react';
import { WalletModalProvider } from '@provablehq/aleo-wallet-adaptor-react-ui';
import { PuzzleWalletAdapter } from '@provablehq/aleo-wallet-adaptor-puzzle';
import { LeoWalletAdapter } from '@provablehq/aleo-wallet-adaptor-leo';
import { ShieldWalletAdapter } from '@provablehq/aleo-wallet-adaptor-shield';
import { FoxWalletAdapter } from '@provablehq/aleo-wallet-adaptor-fox';
import { SoterWalletAdapter } from '@provablehq/aleo-wallet-adaptor-soter';
import { Network } from '@provablehq/aleo-types';
import { DecryptPermission } from '@provablehq/aleo-wallet-adaptor-core';
import { Routes, Route, Navigate } from 'react-router-dom';

import '@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css';

import { AppLayout } from './components/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Borrow } from './pages/Borrow';
import { Markets } from './pages/Markets';
import { History } from './pages/History';
import { PrivLendProvider } from './context/PrivLendContext';

export const PROGRAM_ID = 'privlend.aleo';

export default function App() {
  const wallets = useMemo(() => [
    new PuzzleWalletAdapter(),
    new LeoWalletAdapter(),
    new ShieldWalletAdapter(),
    new FoxWalletAdapter(),
    new SoterWalletAdapter()
  ], []);

  return (
    <AleoWalletProvider
      wallets={wallets}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.UponRequest}
      autoConnect={true}
      programs={[PROGRAM_ID]}
    >
      <WalletModalProvider>
        <PrivLendProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/borrow" element={<Borrow />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/history" element={<History />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </PrivLendProvider>
      </WalletModalProvider>
    </AleoWalletProvider>
  );
}