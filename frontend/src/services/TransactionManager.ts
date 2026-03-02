import { PROGRAM_ID } from "../utils/aleo";

export type TxStatus = "Pending" | "Completed" | "Failed";

export interface TransactionItem {
  id: string;
  type: string;
  status: TxStatus;
  timestamp: number;
}

export class TransactionManager {
  private requestTransactionHistory: any;

  constructor(requestTransactionHistory: any) {
    this.requestTransactionHistory = requestTransactionHistory;
  }

  async load(): Promise<TransactionItem[]> {
    if (!this.requestTransactionHistory) return [];

    try {
      const history = await this.requestTransactionHistory(PROGRAM_ID);

      if (!history?.transactions) return [];

      const mapped: TransactionItem[] = history.transactions.map((tx: any) => ({
        id: tx.transactionId,
        type: this.mapFunctionName(tx.functionName),
        status: this.mapStatus(tx.status),
        timestamp: tx.timestamp || Date.now()
      }));

      return mapped.reverse();
    } catch (err) {
      console.error("TransactionManager load failed:", err);
      return [];
    }
  }

  private mapStatus(status: string): TxStatus {
    const s = status?.toLowerCase() || "";

    if (s.includes("completed") || s.includes("accepted"))
      return "Completed";

    if (s.includes("failed") || s.includes("rejected"))
      return "Failed";

    return "Pending";
  }

  private mapFunctionName(fn?: string): string {
    if (!fn) return "Unknown";

    if (fn.includes("create_credit_tier"))
      return "Create Credit Tier";

    if (fn.includes("create_loan"))
      return "Create Loan";

    if (fn.includes("repay"))
      return "Repay Loan";

    if (fn.includes("liquidate"))
      return "Liquidate";

    return fn;
  }
}