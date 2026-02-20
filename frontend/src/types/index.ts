// Credit Tier Types
export interface CreditTier {
  owner: string;
  tier: 0 | 1 | 2;
  nonce: string;
}

// Loan Record Types
export interface Loan {
  owner: string;
  lender: string;
  loan_id: number;
  principal: bigint;
  collateral: bigint;
  tier: 0 | 1 | 2;
  interest_bps: number;
  start_block: number;
  duration_blocks: number;
  repaid: bigint;
  status: 0 | 1 | 2 | 3; // 0=active, 1=defaulted, 2=repaid, 3=liquidated
}

// Public Loan Info from Mappings
export interface LoanPublic {
  loan_id: number;
  active: boolean;
  owner: string;
  deadline: number;
}

// Network Statistics
export interface NetworkStats {
  totalLoans: number;
  activeLoans: number;
  totalVolume: bigint;
  avgInterestRate: number;
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

// Form Data Types
export interface CreateLoanFormData {
  lender: string;
  principal: number;
  collateral: number;
  interest_bps: number;
  duration_blocks: number;
}

export interface CreateCreditTierFormData {
  tier: 0 | 1 | 2;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  error?: string;
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