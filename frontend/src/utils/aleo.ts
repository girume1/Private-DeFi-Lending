import { LoanPublic } from '../types';

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID;
export const NETWORK = import.meta.env.VITE_NETWORK;
export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

export class AleoService {

  // ===============================
  // Latest Block (FIXED)
  // ===============================
  async getLatestBlock(): Promise<number> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${NETWORK}/latest/height`
      );

      if (!response.ok) return 0;

      const data = await response.json();

      if (typeof data === "number") return data;
      if (typeof data?.height === "number") return data.height;

      return Number(data) || 0;
    } catch (error) {
      console.error("Error fetching latest block:", error);
      return 0;
    }
  }

  // ===============================
  // Loan Counter
  // ===============================
  async getLoanCounter(): Promise<number> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_counter/0u32`
      );

      if (!response.ok) return 0;

      const data = await response.text();
      return parseInt(data.replace('u32', ''));
    } catch {
      return 0;
    }
  }

  // ===============================
  // Single Public Loan
  // ===============================
  async getLoanPublic(loanId: number): Promise<LoanPublic | null> {
    try {
      const [activeRes, ownerRes, deadlineRes] = await Promise.all([
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_active/${loanId}u32`),
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_owner/${loanId}u32`),
        fetch(`${API_ENDPOINT}/${NETWORK}/program/${PROGRAM_ID}/mapping/loan_deadline/${loanId}u32`)
      ]);

      if (!activeRes.ok || !ownerRes.ok || !deadlineRes.ok) return null;

      const activeText = await activeRes.text();
      const ownerText = await ownerRes.text();
      const deadlineText = await deadlineRes.text();

      return {
        loan_id: loanId,
        active: activeText === 'true',
        owner: ownerText.replace(/['"]+/g, ''),
        deadline: parseInt(deadlineText.replace('u32', ''))
      };
    } catch {
      return null;
    }
  }

  // ===============================
  // Loans by Borrower
  // ===============================
  async getLoansByBorrower(
    borrower: string,
    maxLoanId: number
  ): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];

    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.owner === borrower) loans.push(loan);
    }

    return loans;
  }

  // ===============================
  // Expired Loans
  // ===============================
  async getExpiredLoans(
    currentBlock: number,
    maxLoanId: number
  ): Promise<LoanPublic[]> {
    const expired: LoanPublic[] = [];

    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.active && loan.deadline < currentBlock) {
        expired.push(loan);
      }
    }

    return expired;
  }

  // ===============================
  // All Loans
  // ===============================
  async getAllLoans(maxLoanId: number): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];

    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan) loans.push(loan);
    }

    return loans;
  }
}