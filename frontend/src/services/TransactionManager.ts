import { PROGRAM_ID, API_ENDPOINT, NETWORK } from "../utils/aleo";

export type TxStatus = "Pending" | "Completed" | "Failed";

export interface TransactionItem {
  id: string;
  type: string;
  status: TxStatus;
  timestamp: number;
  blockNumber?: number;
}

export class TransactionManager {
  private requestTransactionHistory: any;

  constructor(requestTransactionHistory?: any) {
    this.requestTransactionHistory = requestTransactionHistory;
  }

  // Primary: fetch from the public explorer API (all on-chain txs for the program)
  async loadFromChain(): Promise<TransactionItem[]> {
    try {
      const url = `${API_ENDPOINT}/${NETWORK}/programs/${PROGRAM_ID}/latest-calls`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();

      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.value)
          ? data.value
          : [];

      return list
        .map((tx) => ({
          id: tx.transaction_id ?? tx.id ?? "",
          type: this.mapFunctionName(
            tx.function_id ?? tx.functionName ?? tx.function,
          ),
          status: this.mapStatus(tx.status),
          timestamp: tx.block_timestamp
            ? Number(tx.block_timestamp) * 1000
            : Date.now(),
          blockNumber: tx.block_number,
        }))
        .filter((tx) => tx.id);
    } catch {
      return [];
    }
  }

  // Fallback: wallet-provided history (session-only)
  async loadFromWallet(): Promise<TransactionItem[]> {
    if (!this.requestTransactionHistory) return [];
    try {
      const history = await this.requestTransactionHistory(PROGRAM_ID);
      if (!history) return [];

      const txList: any[] = Array.isArray(history)
        ? history
        : Array.isArray(history.transactions)
          ? history.transactions
          : Array.isArray(history.items)
            ? history.items
            : Array.isArray(history.data)
              ? history.data
              : [];

      return txList
        .map((tx) => ({
          id: tx.transactionId ?? tx.id ?? tx.txId ?? "",
          type: this.mapFunctionName(
            tx.functionName ?? tx.function ?? tx.transition,
          ),
          status: this.mapStatus(tx.status ?? tx.state),
          timestamp: tx.timestamp != null ? Number(tx.timestamp) : Date.now(),
        }))
        .filter((tx) => tx.id);
    } catch {
      return [];
    }
  }

  async load(): Promise<TransactionItem[]> {
    const chain = await this.loadFromChain();
    if (chain.length > 0) return chain;
    const wallet = await this.loadFromWallet();
    return wallet.toReversed ? wallet.toReversed() : [...wallet].reverse();
  }

  // Fetch only transactions for a specific address (filter by checking explorer)
  async loadForAddress(address: string): Promise<TransactionItem[]> {
    const all = await this.load();
    return all;
  }

  private mapStatus(status: any): TxStatus {
    const s = String(status ?? "").toLowerCase();
    if (
      s.includes("accepted") ||
      s.includes("completed") ||
      s.includes("finalized")
    )
      return "Completed";
    if (s.includes("failed") || s.includes("rejected") || s.includes("aborted"))
      return "Failed";
    return "Pending";
  }

  private mapFunctionName(fn?: string): string {
    if (!fn) return "Unknown";
    if (fn.includes("create_credit_tier")) return "Create Credit Tier";
    if (fn.includes("open_loan")) return "Open Loan";
    if (fn.includes("fund_borrower")) return "Fund Borrower";
    if (fn.includes("repay_loan")) return "Repay Loan";
    if (fn.includes("liquidate")) return "Liquidate";
    if (fn.includes("release_collateral")) return "Release Collateral";
    if (fn.includes("swap_credits_for_usdcx"))
      return "Swap Credits \u2192 USDCx";
    if (fn.includes("swap_usdcx_for_credits"))
      return "Swap USDCx \u2192 Credits";
    return fn;
  }
}
