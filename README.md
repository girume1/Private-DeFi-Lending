<p align="center"> <img src="https://i.ibb.co/kTMVCmm/Private.jpg"> </p>

# 🔐 Private DeFi Lending — Aleo Testnet

A privacy-preserving decentralized lending protocol built on **Aleo** using **zero-knowledge proofs**.

This protocol enables borrowers and lenders to interact securely while keeping sensitive financial data — including loan amounts, collateral, and credit tiers — completely private.

Built with **Leo smart contracts** and a **React frontend**.

---

# 🌐 Live Overview

- Network: Aleo Testnet
- Privacy Layer: Zero-Knowledge Proofs
- Smart Contract Language: Leo
- Frontend: React + Vite
- Wallet Adapter: @provablehq

---

# 🚀 Features

## Private Credit Tier

Users create private credit profiles:

- Credit score tier
- Stored as private record
- Only user controls access

---

## Private Loan Creation

Borrowers can:

- Request loans privately
- Lock collateral securely
- Keep loan details confidential

Hidden Data:

- Loan amount
- Collateral amount
- Credit score

---

## Secure Repayment

Borrowers repay loans privately.

Protocol:

- Verifies repayment using ZK
- Updates loan status on-chain
- Releases collateral

---

## Public State Tracking

Public mappings store:

- Loan active status
- Loan ownership
- Loan deadlines

No sensitive data exposed.

---

# 🧠 Why Aleo?

Aleo enables:

- Private smart contracts
- Zero-knowledge execution
- Confidential financial applications

Perfect for DeFi privacy.

---

# 🏗 Project Structure


---

# ⚙ Smart Contract Transitions

### create_credit_tier

Creates private credit profile

Output:

CreditTier record

---

### create_loan_private

Creates private loan

Outputs:

Loan record  
Collateral record

---

### register_loan_public

Registers loan publicly

Stores:

Loan status  
Owner  
Deadline

---

### repay_private

Repays loan privately

Updates loan record

---

### mark_repaid_public

Marks loan completed

---

### liquidate_public

Liquidates expired loan

---

# 🔐 Privacy Design

Private:

Loan amount  
Collateral  
Credit score  

Public:

Loan status  
Deadline  

---

# 🧰 Tech Stack

Leo  
Aleo  
React  
Vite  
---

# 🎯 Use Case

Solves major DeFi privacy problems:

Traditional DeFi exposes:

Wallet balance  
Collateral  
Loan size  

This protocol keeps everything private.

---


# 🔮 Future Improvements

Liquidation bots  

Private credit scoring  

DAO governance  

---

# ⭐ Built for the Future of Private DeFi
