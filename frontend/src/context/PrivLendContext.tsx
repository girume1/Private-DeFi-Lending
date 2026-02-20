import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { AleoService } from '../utils/aleo';
import { LoanPublic, NetworkStats } from '../types';
import toast from 'react-hot-toast';

// 1. Define the Transaction Interface
export interface AleoTransaction {
  id: string;
  type: string;
  status: 'Pending' | 'Completed' | 'Failed';
  timestamp: number;
}

interface PrivLendContextType {
  service: AleoService;
  currentBlock: number;
  loanCounter: number;
  userLoans: LoanPublic[];
  expiredLoans: LoanPublic[];
  transactionHistory: AleoTransaction[];
  allPublicLoans: LoanPublic[];
  stats: NetworkStats;
  loading: boolean;
  refreshData: () => Promise<void>;
  addTransaction: (id: string, type: string) => void; 
  updateTransactionStatus: (id: string, status: 'Completed' | 'Failed') => void; 
}

const PrivLendContext = createContext<PrivLendContextType | undefined>(undefined);

export const usePrivLend = () => {
  const context = useContext(PrivLendContext);
  if (!context) {
    throw new Error('usePrivLend must be used within PrivLendProvider');
  }
  return context;
};

export const PrivLendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, address } = useWallet();
  const [service] = useState(() => new AleoService());
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [loanCounter, setLoanCounter] = useState<number>(0);
  const [userLoans, setUserLoans] = useState<LoanPublic[]>([]);
  const [expiredLoans, setExpiredLoans] = useState<LoanPublic[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<AleoTransaction[]>([]); 
  const [allPublicLoans, setAllPublicLoans] = useState<LoanPublic[]>([]);
  const [stats, setStats] = useState<NetworkStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalVolume: BigInt(0),
    avgInterestRate: 5.2
  });
  const [loading, setLoading] = useState(true);

  // Helper to add a new TX to history
  const addTransaction = useCallback((id: string, type: string) => {
    const newTx: AleoTransaction = {
      id,
      type,
      status: 'Pending',
      timestamp: Date.now()
    };
    setTransactionHistory(prev => [newTx, ...prev]);
  }, []);

  // Helper to update status once confirmed
  const updateTransactionStatus = useCallback((id: string, status: 'Completed' | 'Failed') => {
    setTransactionHistory(prev => 
      prev.map(tx => tx.id === id ? { ...tx, status } : tx)
    );
  }, []);

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
        activeLoans: activeCount,
      }));

      if (connected && address) {
        const user = await service.getLoansByBorrower(address, counter);
        setUserLoans(user);
      } else {
        setUserLoans([]);
      }

      const expired = await service.getExpiredLoans(block, counter);
      setExpiredLoans(expired);

    } catch (error) {
      console.error('Error refreshing data:', error);
      // Removed toast from interval to avoid spamming the user
    } finally {
      setLoading(false);
    }
  }, [service, connected, address]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); 
    return () => clearInterval(interval);
  }, [refreshData]);

  return (
    <PrivLendContext.Provider value={{
      service,
      currentBlock,
      loanCounter,
      userLoans,
      expiredLoans,
      transactionHistory, // Pass to components
      stats,
      loading,
      allPublicLoans,
      refreshData,
      addTransaction, // Pass to components
      updateTransactionStatus // Pass to components
    }}>
      {children}
    </PrivLendContext.Provider>
  );
};