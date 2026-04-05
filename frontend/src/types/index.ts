// Credit Tier Types
export interface CreditTier {
  owner: string;
  tier: 0 | 1 | 2;
  nonce: string;
}

// Loan Record Types (Private)
export interface Loan {
  owner: string;
  lender: string;
  loan_id: number;
  principal: bigint; // u128 - USDCx
  collateral: bigint; // u64 - microcredits
  tier: 0 | 1 | 2;
  interest_bps: number;
  start_block: number;
  duration_blocks: number;
  repaid: bigint; // u128 - USDCx repaid
  status: 0 | 2 | 3; // 0=active, 2=repaid, 3=liquidated
}

// Collateral Record
export interface Collateral {
  owner: string;
  loan_id: number;
  amount: bigint; // u64 - microcredits
  locked_until: number;
}

// Public Loan Info from Mappings
export interface LoanPublic {
  loan_id: number;
  active: boolean;
  owner: string;
  lender: string;
  deadline: number;
  collateral_locked: boolean;
}

// On-chain repayment count (from repayment_count mapping)
export interface RepaymentCount {
  borrower: string;
  count: number; // u32
}

// On-chain loan principal (from loan_principal mapping)
export interface LoanPrincipalRecord {
  loan_id: number;
  principal: bigint; // u128
}

// Network Statistics
export interface NetworkStats {
  totalLoans: number;
  activeLoans: number;
  totalVolumeUSDCx: bigint; // Track both tokens
  totalVolumeCredits: bigint;
  tvlUSDCx: bigint; // Total Value Locked in USDCx
  tvlCredits: bigint; // Total Value Locked in microcredits
  avgInterestRate: number;
}

// Token Balances
export interface TokenBalances {
  usdcx: bigint;
  credits: bigint;
}

// Swap Types
export interface SwapFormData {
  amountIn: bigint;
  minOut: bigint;
  direction: "credits-to-usdcx" | "usdcx-to-credits";
}

// Transaction Request
export interface TransactionRequest {
  program: string;
  function: string;
  inputs: string[];
  fee?: number;
  privateFee?: boolean;
}

// Wallet State
export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string;
}

// Form Data Types (v2)
export interface CreateLoanFormData {
  lender: string;
  principal: bigint; // USDCx amount
  collateral: bigint; // microcredits amount
  interest_bps: number;
  duration_blocks: number;
  credit_tier_nonce: string;
}

export interface CreateCreditTierFormData {
  tier: 0 | 1 | 2;
}

// Component Props Types
export interface LoanCardProps {
  loan: LoanPublic;
  onUpdate: () => void;
}

export interface StatsDashboardProps {
  className?: string;
}

export interface WalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Lender-specific types
export interface LenderPosition {
  loan_id: number;
  borrower: string;
  principal: bigint; // USDCx lent
  interest_bps: number;
  deadline: number;
  status: "active" | "repaid" | "liquidated";
}
