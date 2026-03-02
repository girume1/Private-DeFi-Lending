<p align="center">
  <img src="https://i.ibb.co/kTMVCmm/Private.jpg" width="70%" />
</p>

<h1 align="center">
🔐 PrivLend — Private DeFi Lending on Aleo
</h1>

<p align="center">
Zero-Knowledge Powered Confidential Lending Protocol
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Network-Aleo_Testnet-purple" />
  <img src="https://img.shields.io/badge/Smart_Contracts-Leo-blue" />
  <img src="https://img.shields.io/badge/Frontend-React_+_Vite-61dafb" />
  <img src="https://img.shields.io/badge/ZK-Zero_Knowledge-green" />
  <img src="https://img.shields.io/badge/Status-Active_Development-brightgreen" />
</p>

---

# 🚀 Overview

**PrivLend** is a privacy-preserving decentralized lending protocol built on **Aleo**.

It enables borrowers and lenders to interact without exposing:

- Loan amount  
- Collateral value  
- Credit tier  
- Financial position  

All sensitive data remains encrypted and verified via **Zero-Knowledge Proofs**.

Only essential metadata is stored publicly.

---

# 🌐 Live Deployment

👉 https://privlend.vercel.app  
Network: Aleo Testnet  

---

# 🧠 Architecture

```
React Frontend
        ↓
Aleo Wallet Adapter (@provablehq)
        ↓
Leo Smart Contract (privlend.aleo)
        ↓
Public Mappings (Status Only)
```

Private records remain encrypted inside user wallets.

---

# 🔐 Privacy Model

## 🟢 Private (ZK Protected)

- Principal Amount
- Collateral Amount
- Credit Tier
- Repayment Details

## 🔵 Public

- Loan ID
- Loan Owner
- Active Status
- Deadline

No financial data is exposed on-chain.

---

# 🏗 Smart Contract Transitions

| Function | Privacy | Description |
|----------|----------|------------|
| `create_credit_tier` | Private | Creates private credit profile |
| `create_loan_private` | Private | Generates confidential loan record |
| `register_loan_public` | Public | Registers loan metadata |
| `repay_private` | Private | Repays loan confidentially |
| `mark_repaid_public` | Public | Marks loan completed |
| `liquidate_public` | Public | Liquidates expired loans |

---

# 💰 Loan Lifecycle

1️⃣ Create Credit Tier (Private)  
2️⃣ Create Private Loan (ZK Proof)  
3️⃣ Register Loan Publicly  
4️⃣ Loan Appears in Dashboard  
5️⃣ Repay Privately  
6️⃣ Public Status Updated  

---

# 🛠 Local Development

## 1️⃣ Install Dependencies

```bash
pnpm install
```

## 2️⃣ Environment Variables

Create `.env` file:

```env
VITE_PROGRAM_ID=privlend.aleo
VITE_NETWORK=testnet
VITE_API_ENDPOINT=https://api.explorer.provable.com/v2
```

## 3️⃣ Run Development Server

```bash
pnpm dev
```

---

# 🧪 Example Transaction Flow

Private transaction:

```
create_loan_private
```

Public transaction:

```
register_loan_public
```

Explorer confirms:
- Private proof accepted
- Public mapping written

Dashboard updates automatically.

---

# 🔮 Future Roadmap

- 🤖 Automated liquidation bots
- 🏛 DAO governance
- 🧠 Private reputation scoring
- 🌉 Cross-chain collateral support
- 🚀 Mainnet deployment

---

# 🧠 Why Aleo?

Traditional DeFi exposes:

- Wallet balances
- Loan size
- Collateral positions

Aleo enables:

- Confidential smart contracts
- Private execution
- Zero-knowledge verification

PrivLend demonstrates the future of private DeFi.

---

# ⭐ Vision

Financial privacy should be default.

PrivLend proves:

**DeFi can be transparent in logic, but private in data.**

---

# 🛡 Built With

- Leo (Aleo smart contracts)
- React + Vite
- Material UI
- Aleo Wallet Adapter (@provablehq)
- Zero-Knowledge Proofs

---

# 📄 License

MIT License

---

<p align="center">
Built for the Future of Private Finance 🔐
</p>
