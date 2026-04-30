import React, { useMemo } from "react";
import { AleoWalletProvider } from "@provablehq/aleo-wallet-adaptor-react";
import { WalletModalProvider } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { PuzzleWalletAdapter } from "@provablehq/aleo-wallet-adaptor-puzzle";
import { LeoWalletAdapter } from "@provablehq/aleo-wallet-adaptor-leo";
import { ShieldWalletAdapter } from "@provablehq/aleo-wallet-adaptor-shield";
import { FoxWalletAdapter } from "@provablehq/aleo-wallet-adaptor-fox";
import { SoterWalletAdapter } from "@provablehq/aleo-wallet-adaptor-soter";
import { Network } from "@provablehq/aleo-types";
import { DecryptPermission } from "@provablehq/aleo-wallet-adaptor-core";
import { Routes, Route, Navigate } from "react-router-dom";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";

import "@provablehq/aleo-wallet-adaptor-react-ui/dist/styles.css";

import { AppLayout } from "./components/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Borrow } from "./pages/Borrow";
import { Markets } from "./pages/Markets";
import Portfolio from "./pages/Portfolio";
import SwapPage from "./pages/SwapPage";
import Docs from "./components/Docs";
import { PrivLendProvider } from "./context/PrivLendContext";
import Landing from "./pages/Landing";
import { PROGRAM_ID, CREDITS_PROGRAM, USDCX_PROGRAM } from "./utils/aleo";
export { PROGRAM_ID, CREDITS_PROGRAM, USDCX_PROGRAM } from "./utils/aleo";

export default function App() {
  const wallets = useMemo(
    () => [
      new PuzzleWalletAdapter(),
      new LeoWalletAdapter(),
      new ShieldWalletAdapter(),
      new FoxWalletAdapter(),
      new SoterWalletAdapter(),
    ],
    [],
  );

  const WalletAwarePrivLendProvider: React.FC<{
    children: React.ReactNode;
  }> = ({ children }) => {
    const { address } = useWallet();

    return (
      <PrivLendProvider key={address ?? "no-wallet"}>
        {children}
      </PrivLendProvider>
    );
  };

  return (
    <AleoWalletProvider
      wallets={wallets}
      network={Network.TESTNET}
      decryptPermission={DecryptPermission.UponRequest}
      autoConnect={}
      programs={[PROGRAM_ID, CREDITS_PROGRAM, USDCX_PROGRAM]}
    >
      <WalletModalProvider>
        <WalletAwarePrivLendProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/borrow" element={<Borrow />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </WalletAwarePrivLendProvider>
      </WalletModalProvider>
    </AleoWalletProvider>
  );
}
