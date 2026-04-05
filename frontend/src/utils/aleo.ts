import { LoanPublic, TokenBalances } from "../types";

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID || "privlend_v6.aleo";
export const NETWORK = import.meta.env.VITE_NETWORK || "testnet";
export const API_ENDPOINT =
  import.meta.env.VITE_API_ENDPOINT || "https://api.explorer.provable.com/v2";
export const USDCX_PROGRAM =
  import.meta.env.VITE_USDCX_PROGRAM || "test_usdcx_stablecoin.aleo";
export const CREDITS_PROGRAM =
  import.meta.env.VITE_CREDITS_PROGRAM || "credits.aleo";

// Safe BigInt parser — never throws
function safeBigInt(raw: string, suffix: RegExp): bigint {
  try {
    const cleaned = raw.replace(/['"]/g, "").replace(suffix, "").trim();
    if (!cleaned || cleaned === "null" || cleaned === "undefined") return 0n;
    return BigInt(cleaned);
  } catch {
    return 0n;
  }
}

export class AleoService {
  private base(network = NETWORK) {
    return `${API_ENDPOINT}/${network}`;
  }

  async getLatestBlock(): Promise<number> {
    try {
      const res = await fetch(`${this.base()}/block/height/latest`);
      if (!res.ok) return 0;
      const data = await res.json();
      if (typeof data === "number") return data;
      if (typeof data?.height === "number") return data.height;
      const n = Number(data);
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }

  async getLoanCounter(): Promise<number> {
    try {
      const res = await fetch(
        `${this.base()}/program/${PROGRAM_ID}/mapping/loan_counter/0u32`,
      );
      if (res.status === 404) return 0;
      if (!res.ok) return 0;
      const text = await res.text();
      const n = parseInt(
        text.replace(/['"]/g, "").replace(/u32$/i, "").trim(),
        10,
      );
      return isNaN(n) ? 0 : n;
    } catch {
      return 0;
    }
  }

  async getLoanPublic(loanId: number): Promise<LoanPublic | null> {
    try {
      const base = this.base();
      const prog = PROGRAM_ID;
      const id = `${loanId}u32`;

      const [activeRes, ownerRes, lenderRes, deadlineRes, collateralRes] =
        await Promise.all([
          fetch(`${base}/program/${prog}/mapping/loan_active/${id}`),
          fetch(`${base}/program/${prog}/mapping/loan_owner/${id}`),
          fetch(`${base}/program/${prog}/mapping/loan_lender/${id}`),
          fetch(`${base}/program/${prog}/mapping/loan_deadline/${id}`),
          fetch(`${base}/program/${prog}/mapping/collateral_locked/${id}`),
        ]);

      // loan_active is the authoritative existence check — if missing, loan doesn't exist
      if (!activeRes.ok) return null;

      const activeText = await activeRes.text();
      const ownerText = ownerRes.ok ? await ownerRes.text() : '""';
      const lenderText = lenderRes.ok ? await lenderRes.text() : '""';
      const deadlineText = deadlineRes.ok ? await deadlineRes.text() : "0u32";
      const collateralText = collateralRes.ok
        ? await collateralRes.text()
        : "false";

      const active = activeText.replace(/['"]/g, "").trim() === "true";
      const owner = ownerText.replace(/['"]/g, "").trim();
      const lender = lenderText.replace(/['"]/g, "").trim();
      const deadline = parseInt(
        deadlineText.replace(/['"]/g, "").replace(/u32$/i, "").trim(),
        10,
      );
      const collateralLocked =
        collateralText.replace(/['"]/g, "").trim() === "true";

      if (!owner || !lender || isNaN(deadline)) return null;

      return {
        loan_id: loanId,
        active,
        owner,
        lender,
        deadline,
        collateral_locked: collateralLocked,
      };
    } catch {
      return null;
    }
  }

  // Fetch all loans in parallel — no more serial await-in-loop
  async getAllLoans(maxLoanId: number): Promise<LoanPublic[]> {
    const results = await Promise.all(
      Array.from({ length: maxLoanId }, (_, i) => this.getLoanPublic(i + 1)),
    );
    return results.filter((l): l is LoanPublic => l !== null);
  }

  async getLoansByBorrower(
    borrower: string,
    maxLoanId: number,
  ): Promise<LoanPublic[]> {
    const all = await this.getAllLoans(maxLoanId);
    return all.filter((l) => l.owner === borrower);
  }

  async getLoansByLender(
    lender: string,
    maxLoanId: number,
  ): Promise<LoanPublic[]> {
    const all = await this.getAllLoans(maxLoanId);
    return all.filter((l) => l.lender === lender);
  }

  async getExpiredLoans(
    currentBlock: number,
    maxLoanId: number,
  ): Promise<LoanPublic[]> {
    const all = await this.getAllLoans(maxLoanId);
    return all.filter((l) => l.active && l.deadline < currentBlock);
  }

  // DRY helper for public mapping balance reads
  private async getMappingBalance(
    program: string,
    suffix: RegExp,
  ): Promise<(address: string) => Promise<bigint>> {
    return async (address: string) => {
      try {
        const res = await fetch(
          `${this.base()}/program/${program}/mapping/account/${address}`,
        );
        if (!res.ok) return 0n;
        return safeBigInt(await res.text(), suffix);
      } catch {
        return 0n;
      }
    };
  }

  async getUSDCxBalance(address: string): Promise<bigint> {
    try {
      // test_usdcx_stablecoin.aleo uses 'balances' mapping (not 'account')
      const res = await fetch(
        `${this.base()}/program/${USDCX_PROGRAM}/mapping/balances/${address}`,
      );
      if (!res.ok) return 0n;
      return safeBigInt(await res.text(), /u128$/i);
    } catch {
      return 0n;
    }
  }

  async getCreditsBalance(address: string): Promise<bigint> {
    try {
      const res = await fetch(
        `${this.base()}/program/${CREDITS_PROGRAM}/mapping/account/${address}`,
      );
      if (!res.ok) return 0n;
      return safeBigInt(await res.text(), /u64$/i);
    } catch {
      return 0n;
    }
  }

  async getTokenBalances(address: string): Promise<TokenBalances> {
    const [usdcx, credits] = await Promise.all([
      this.getUSDCxBalance(address),
      this.getCreditsBalance(address),
    ]);
    return { usdcx, credits };
  }

  // TVL: count collateral_locked across all active loans (credits only —
  // USDCx principal is private and not readable from public mappings)
  async getTVL(maxLoanId: number): Promise<{ usdcx: bigint; credits: bigint }> {
    const loans = await this.getAllLoans(maxLoanId);
    const lockedCount = loans.filter(
      (l) => l.active && l.collateral_locked,
    ).length;
    // collateral_locked is now bool; return count as a proxy (actual amounts are private)
    return { usdcx: 0n, credits: BigInt(lockedCount) };
  }
}
