import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";

import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AleoService } from "../utils/aleo";
import { LoanPublic, NetworkStats } from "../types";
import { TransactionManager, TransactionItem } from "../services/TransactionManager";

interface PrivLendContextType {
  service: AleoService;
  currentBlock: number;
  loanCounter: number;
  userLoans: LoanPublic[];
  expiredLoans: LoanPublic[];
  allPublicLoans: LoanPublic[];
  stats: NetworkStats;
  loading: boolean;

  transactionHistory: TransactionItem[];
  refreshData: () => Promise<void>;
}

const PrivLendContext = createContext<PrivLendContextType | undefined>(undefined);

export const usePrivLend = () => {
  const context = useContext(PrivLendContext);
  if (!context)
    throw new Error("usePrivLend must be used within PrivLendProvider");
  return context;
};

export const PrivLendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, address, requestTransactionHistory } = useWallet();
  const [service] = useState(() => new AleoService());

  const [currentBlock, setCurrentBlock] = useState(0);
  const [loanCounter, setLoanCounter] = useState(0);
  const [userLoans, setUserLoans] = useState<LoanPublic[]>([]);
  const [expiredLoans, setExpiredLoans] = useState<LoanPublic[]>([]);
  const [allPublicLoans, setAllPublicLoans] = useState<LoanPublic[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<NetworkStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalVolume: BigInt(0),
    avgInterestRate: 5.2
  });

  const loadTransactions = useCallback(async () => {
    if (!connected || !requestTransactionHistory) {
      setTransactionHistory([]);
      return;
    }

    const manager = new TransactionManager(requestTransactionHistory);
    const txs = await manager.load();
    setTransactionHistory(txs);
  }, [connected, requestTransactionHistory]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);

      const [block, counter] = await Promise.all([
        service.getLatestBlock(),
        service.getLoanCounter()
      ]);

      setCurrentBlock(block);
      setLoanCounter(counter);

      const allLoans = await service.getAllLoans(counter);
      setAllPublicLoans(allLoans);

      const activeCount = allLoans.filter(l => l.active).length;

      setStats(prev => ({
        ...prev,
        totalLoans: counter,
        activeLoans: activeCount
      }));

      if (connected && address) {
        const user = await service.getLoansByBorrower(address, counter);
        setUserLoans(user);
      } else {
        setUserLoans([]);
      }

      const expired = await service.getExpiredLoans(block, counter);
      setExpiredLoans(expired);

      await loadTransactions();

    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setLoading(false);
    }
  }, [service, connected, address, loadTransactions]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 20000);
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <PrivLendContext.Provider
      value={{
        service,
        currentBlock,
        loanCounter,
        userLoans,
        expiredLoans,
        allPublicLoans,
        stats,
        loading,
        transactionHistory,
        refreshData
      }}
    >
      {children}
    </PrivLendContext.Provider>
  );
};