import { LoanPublic } from '../types';

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || "privlend.aleo";
export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "https://api.explorer.provable.com/v2";

export class AleoService {
  async getLatestBlock(): Promise<number> {
    try {
      const response = await fetch(`${API_ENDPOINT}/testnet/latest/height`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest block:', error);
      return 0;
    }
  }

  async getLoanCounter(): Promise<number> {
    try {
      const response = await fetch(
        `${API_ENDPOINT}/testnet/program/${PROGRAM_ID}/mapping/loan_counter/0u32`
      );
      if (!response.ok) return 0;
      const data = await response.text();
      return parseInt(data.replace('u32', ''));
    } catch {
      return 0;
    }
  }

  async getLoanPublic(loanId: number): Promise<LoanPublic | null> {
    try {
      const [activeRes, ownerRes, deadlineRes] = await Promise.all([
        fetch(`${API_ENDPOINT}/testnet/program/${PROGRAM_ID}/mapping/loan_active/${loanId}u32`),
        fetch(`${API_ENDPOINT}/testnet/program/${PROGRAM_ID}/mapping/loan_owner/${loanId}u32`),
        fetch(`${API_ENDPOINT}/testnet/program/${PROGRAM_ID}/mapping/loan_deadline/${loanId}u32`)
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

  async getLoansByBorrower(borrower: string, maxLoanId: number): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.owner === borrower) loans.push(loan);
    }
    return loans;
  }

  async getExpiredLoans(currentBlock: number, maxLoanId: number): Promise<LoanPublic[]> {
    const expired: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan && loan.active && loan.deadline < currentBlock) expired.push(loan);
    }
    return expired;
  }

  async getAllLoans(maxLoanId: number): Promise<LoanPublic[]> {
    const loans: LoanPublic[] = [];
    for (let i = 1; i <= maxLoanId; i++) {
      const loan = await this.getLoanPublic(i);
      if (loan) loans.push(loan);
    }
    return loans;
  }
}