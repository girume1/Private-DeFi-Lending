import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { AleoService } from "../utils/aleo";
import { LoanPublic, NetworkStats, TokenBalances } from "../types";
import { TransactionManager, TransactionItem } from "../services/TransactionManager";

interface PrivLendContextType {
  service: AleoService;
  currentBlock: number;
  loanCounter: number;
  allPublicLoans: LoanPublic[];
  userLoans: LoanPublic[];
  lenderLoans: LoanPublic[];
  activePublicLoans: LoanPublic[];
  expiredPublicLoans: LoanPublic[];
  settledPublicLoans: LoanPublic[];
  activeUserLoans: LoanPublic[];
  expiredUserLoans: LoanPublic[];
  settledUserLoans: LoanPublic[];
  activeLenderLoans: LoanPublic[];
  expiredLenderLoans: LoanPublic[];
  balances: TokenBalances;
  stats: NetworkStats;
  transactionHistory: TransactionItem[];
  loading: boolean;
  refreshData: () => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const PrivLendContext = createContext<PrivLendContextType | undefined>(undefined);

export const usePrivLend = () => {
  const ctx = useContext(PrivLendContext);
  if (!ctx) throw new Error("usePrivLend must be used inside PrivLendProvider");
  return ctx;
};

function parseAleoAmount(val: any): bigint {
  if (val === undefined || val === null) return 0n;
  const s = String(val).replace(/u\d+$/i, "").replace(/i\d+$/i, "").trim();
  try { return BigInt(s); } catch { return 0n; }
}

// Recursively search for any numeric amount in a record object
function extractAmount(obj: any, depth = 0): bigint {
  if (!obj || typeof obj !== 'object' || depth > 4) return 0n;
  // 'amount' is first — matches USDCx Token record { owner, amount: u128 }
  const FIELDS = ['amount', 'microcredits', 'balance', 'credits', 'value', 'tokens', 'quantity'];
  for (const f of FIELDS) {
    if (obj[f] !== undefined) {
      const v = parseAleoAmount(obj[f]);
      if (v > 0n) return v;
    }
  }
  // recurse one level
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const v = extractAmount(obj[key], depth + 1);
      if (v > 0n) return v;
    }
  }
  return 0n;
}

function parsePlaintextString(s: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const inner = s.replace(/^\{/, '').replace(/\}$/, '').trim();
    let depth = 0, current = '';
    for (const ch of inner) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (ch === ',' && depth === 0) {
        const parts = current.trim().split(':');
        if (parts.length >= 2) result[parts[0].trim()] = parts.slice(1).join(':').trim();
        current = '';
      } else { current += ch; }
    }
    if (current.trim()) {
      const parts = current.trim().split(':');
      if (parts.length >= 2) result[parts[0].trim()] = parts.slice(1).join(':').trim();
    }
  } catch {}
  return result;
}

function sumRecordAmounts(records: any[], label?: string): bigint {
  const unspent = records.filter(r => !r.spent);
  if (label) {
    console.log(`[PrivLend] ${label}: ${unspent.length} unspent records`);
    if (unspent.length > 0) console.log(`[PrivLend] Sample record:`, JSON.stringify(unspent[0], null, 2));
  }
  return unspent.reduce((sum: bigint, r: any) => {
    for (const src of [r.data?.value, r.data, r]) {
      if (src && typeof src === 'object') {
        const v = extractAmount(src);
        if (v > 0n) return sum + v;
      }
    }
    const pt = r.plaintext ?? r.data?.plaintext;
    if (typeof pt === 'string') {
      if (pt.includes('{')) {
        const v = extractAmount(parsePlaintextString(pt));
        if (v > 0n) return sum + v;
      }
      // Bare value string like "1000000u128"
      const bare = parseAleoAmount(pt);
      if (bare > 0n) return sum + bare;
    }
    return sum;
  }, 0n);
}



export const PrivLendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const walletCtx = useWallet() as any;
  const { connected, address, requestTransactionHistory, requestRecords, requestRecordPlaintexts } = walletCtx;

  const serviceRef = useRef<AleoService>(new AleoService());
  const service = serviceRef.current;

  const [currentBlock, setCurrentBlock]     = useState(0);
  const [loanCounter, setLoanCounter]       = useState(0);
  const [allPublicLoans, setAllPublicLoans] = useState<LoanPublic[]>([]);
  const [userLoans, setUserLoans]           = useState<LoanPublic[]>([]);
  const [lenderLoans, setLenderLoans]       = useState<LoanPublic[]>([]);
  const [balances, setBalances]             = useState<TokenBalances>({ usdcx: 0n, credits: 0n });
  const [transactionHistory, setTransactionHistory] = useState<TransactionItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [stats, setStats] = useState<NetworkStats>({
    totalLoans: 0, activeLoans: 0,
    totalVolumeUSDCx: 0n, totalVolumeCredits: 0n,
    tvlUSDCx: 0n, tvlCredits: 0n, avgInterestRate: 5.2,
  });

  const activePublicLoans  = useMemo(() => allPublicLoans.filter(l =>  l.active && currentBlock <= l.deadline), [allPublicLoans, currentBlock]);
  const expiredPublicLoans = useMemo(() => allPublicLoans.filter(l =>  l.active && currentBlock >  l.deadline), [allPublicLoans, currentBlock]);
  const settledPublicLoans = useMemo(() => allPublicLoans.filter(l => !l.active),                               [allPublicLoans]);
  const activeUserLoans    = useMemo(() => userLoans.filter(l =>  l.active && currentBlock <= l.deadline),      [userLoans, currentBlock]);
  const expiredUserLoans   = useMemo(() => userLoans.filter(l =>  l.active && currentBlock >  l.deadline),      [userLoans, currentBlock]);
  const settledUserLoans   = useMemo(() => userLoans.filter(l => !l.active),                                    [userLoans]);
  const activeLenderLoans  = useMemo(() => lenderLoans.filter(l =>  l.active && currentBlock <= l.deadline),    [lenderLoans, currentBlock]);
  const expiredLenderLoans = useMemo(() => lenderLoans.filter(l =>  l.active && currentBlock >  l.deadline),    [lenderLoans, currentBlock]);

  const loadTransactions = useCallback(async () => {
    try {
      const manager = new TransactionManager(requestTransactionHistory);
      setTransactionHistory(await manager.load());
    } catch (e: any) {
      if (e?.message?.toLowerCase().includes('permission')) {
        console.info('[PrivLend] Transaction history skipped — wallet permission not granted.');
      } else {
        console.warn('[PrivLend] loadTransactions error:', e);
      }
      setTransactionHistory([]);
    }
  }, [connected, requestTransactionHistory]);

  // Helper to fetch records trying both methods
  const fetchRecords = useCallback(async (programId: string): Promise<any[]> => {
    // Try requestRecordPlaintexts first (richer data)
    if (requestRecordPlaintexts) {
      try {
        const result = await requestRecordPlaintexts(programId);
        const recs = Array.isArray(result) ? result : result?.records ?? [];
        if (recs.length > 0) return recs;
      } catch {}
    }
    // Fallback to requestRecords
    if (requestRecords) {
      try {
        const result = await requestRecords(programId);
        return Array.isArray(result) ? result : [];
      } catch {}
    }
    return [];
  }, [requestRecords, requestRecordPlaintexts]);

  const refreshBalances = useCallback(async () => {
    if (!connected || !address) { setBalances({ usdcx: 0n, credits: 0n }); return; }

    // 1. Public chain balances
    const nb = await service.getTokenBalances(address);

    // 2. Private credits fallback
    if (nb.credits === 0n) {
      try {
        const recs = await fetchRecords('credits.aleo');
        const priv = sumRecordAmounts(recs, 'credits.aleo');
        if (priv > 0n) { console.log(`[PrivLend] ✅ Private credits: ${priv}`); nb.credits = priv; }
      } catch (e) { console.warn('[PrivLend] credits fallback error:', e); }
    }

    // 3. Private USDCx fallback
    if (nb.usdcx === 0n) {
      try {
        const recs = await fetchRecords('test_usdcx_stablecoin.aleo');
        const priv = sumRecordAmounts(recs, 'test_usdcx_stablecoin.aleo');
        if (priv > 0n) { console.log(`[PrivLend] ✅ Private USDCx: ${priv}`); nb.usdcx = priv; }
        else console.warn('[PrivLend] ⚠️ USDCx records found but amount=0. Check console above for raw record structure.');
      } catch (e) { console.warn('[PrivLend] USDCx fallback error:', e); }
    }

    setBalances(nb);
  }, [service, connected, address, fetchRecords]);

  // Block polling — lightweight, every 6s
  useEffect(() => {
    const poll = async () => { try { setCurrentBlock(await service.getLatestBlock()); } catch {} };
    poll();
    const id = setInterval(poll, 6_000);
    return () => clearInterval(id);
  }, [service]);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const [block, counter] = await Promise.all([
        service.getLatestBlock(),
        service.getLoanCounter(),
      ]);
      setCurrentBlock(block);
      setLoanCounter(counter);

      // only fetch loans/TVL when there are actually loans to fetch
      const allLoans = counter > 0 ? await service.getAllLoans(counter) : [];
      const tvl = counter > 0 ? await service.getTVL(counter) : { usdcx: 0n, credits: 0n };

      setAllPublicLoans(allLoans);
      const activeCount = allLoans.filter(l => l.active).length;
      setStats(prev => ({ ...prev, totalLoans: counter, activeLoans: activeCount, tvlCredits: tvl.credits, tvlUSDCx: tvl.usdcx }));
      if (connected && address) {
        const [bl, ll] = await Promise.all([
          service.getLoansByBorrower(address, counter),
          service.getLoansByLender(address, counter),
        ]);
        setUserLoans(bl);
        setLenderLoans(ll);
        await refreshBalances();
      } else {
        setUserLoans([]); setLenderLoans([]);
      }
      await loadTransactions();
    } catch (e) { console.error("refreshData error:", e); }
    finally { setLoading(false); }
  }, [service, connected, address, loadTransactions, refreshBalances]);

  const refreshDataRef = useRef(refreshData);
  useEffect(() => { refreshDataRef.current = refreshData; }, [refreshData]);

  // Load once on mount
  useEffect(() => { refreshDataRef.current(); }, []);

  // Re-load when wallet changes
  useEffect(() => { if (!loading) refreshDataRef.current(); }, [connected, address]);

  return (
    <PrivLendContext.Provider value={{
      service, currentBlock, loanCounter,
      allPublicLoans, userLoans, lenderLoans,
      activePublicLoans, expiredPublicLoans, settledPublicLoans,
      activeUserLoans, expiredUserLoans, settledUserLoans,
      activeLenderLoans, expiredLenderLoans,
      balances, stats, transactionHistory,
      loading, refreshData, refreshBalances,
    }}>
      {children}
    </PrivLendContext.Provider>
  );
};
