# Kwagee <img src="images/3.png" width="36"/>
###  **Kwagee: Owl You Need!**

> A Stellar-powered payroll and on-chain budgeting platform built for Filipino freelancers and remote workers — settling international payments in seconds, converting funds transparently, and automatically distributing them across customizable budget wallets for rent, bills, taxes, SSS, and PhilHealth.

---

## 🧩 **Problem**
Filipino freelancers and remote worker face several financial instability due to traditional cross-border payment systems. Workers experience:
- Delays and High Platform Fees
- Hidden Exchange Spreads
- Lack of HR Support
- Skipped Government Contributions

---

## ✨ **Vision**
Kwagee takes its name from *Kuwago* — the Filipino word for owl, a symbol of wisdom, wealth, and awareness. The platform is proudly rooted in Philippine culture, built to give the country's growing class of digital workers the financial infrastructure they deserve: fast, transparent, automated, and entirely on-chain. By anchoring Kwagee to the Stellar ecosystem, we bridge the gap between traditional remittance finance and the programmable financial future — one paycheck at a time.

**Kwagee – Own Your Financial Flight**

---

## 🎯 **Purpose**
Kwagee solves the broken cross-border payroll experience by letting Filipino freelancers receive client payments directly in XLM or USDC on the Stellar blockchain, instantly converting funds to Philippine Peso at transparent rates, and automatically distributing them across customizable on-chain budget wallets — covering rent, bills, taxes, SSS, PhilHealth, and savings — all settled in seconds, at near-zero cost, with no SWIFT delays, no hidden fees, and no HR department required.

---

## 👥 **Target Users**

| User | Location | Why They Care |
|------|----------|---------------|
| Filipino freelancers & remote workers | Quezon City, Manila, Cebu City | Delayed transfers, hidden fees, and missing HR support create unstable cash flow and skipped government contributions |
| International employers & startup teams | Global (Canada, Singapore, SEA) | Need a faster, lower-cost, and more reliable payroll system for managing overseas contractors |

---

## 💎 **Features**

- **Stellar USDC / XLM transfers** — lightning-fast 3–5 second cross-border invoice settlement for fractions of a cent
- **Soroban smart contracts** — manages active invoice registries, tracks user-defined allocation weights, and stores funding states on-chain
- **Freighter Wallet** — secure wallet connection, cryptographic signing for invoice updates, and multi-destination transaction approvals
- **Compliance Anchors** — transaction outputs stream funds to local off-ramp entities (e.g. PDAX) for smooth conversion to Philippine Peso (PHP)
- **Trustlines** — manages asset permissions between sender, contract, and recipient wallets

---

## 💎 **Core Feature (MVP)**

**Invoice → On-Chain Split → Wallet Distribution**

1. **Client action** — International client sends USDC/XLM payment to a Kwagee-generated invoice address
2. **On-chain action** — Soroban contract validates the invoice, reads the freelancer's pre-set allocation weights (e.g. 40% rent, 20% savings, 15% SSS/PhilHealth, 25% bills), and executes multi-destination disbursement atomically
3. **Result** — Freelancer's budget wallets are funded instantly, contributions are scheduled automatically, and a transparent transaction record is written to the Stellar ledger — no manual reconciliation required

> Demo-able in under 2 minutes: submit invoice → confirm payment → view wallet breakdown.

---

## 🛠️ **Tech Stack**
- Frontend: Node.js (v18+), React + Vite
- Backend: Rust
- Blockchain: Stellar (Soroban / Stellar SDK), Soroban CLI
- Other Tools: Freighter Wallet, Cargo (for contract testing)

---

## 📝 **Prerequisites**

- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) `v22.x`
- [Node.js](https://nodejs.org/) `v18+` (for frontend)
- [Freighter Wallet](https://www.freighter.app/) browser extension

---

## 🚀 **How to Run Locally**
```bash
# Clone the repository
git clone https://github.com/your-org/kwagee
cd kwagee
```

```bash
# Install frontend dependencies
npm install
npm run dev
```

```bash
# To build and test the Soroban smart contracts
cd contracts
soroban contract build
cargo test
```

---

## Build

```bash
git clone https://github.com/your-org/kwagee
cd kwagee/contracts
soroban contract build
```

---

## Test

```bash
cargo test
```

---

## 📡 **Deploy to Testnet**

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/kwagee.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>
```

---

## Sample CLI Invocation

```bash
# Register an invoice
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- register_invoice \
  --invoice_id "INV-2026-001" \
  --amount 120000000 \
  --client_wallet GABCDEF... \
  --worker_wallet GXY1234...

# Trigger allocation on payment confirmation
soroban contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- distribute_funds \
  --invoice_id "INV-2026-001" \
  --allocations '{"rent":40,"savings":20,"sss":10,"philhealth":5,"bills":25}'
```

---

## 🌐 Deployment
**Testnet**
- Contract / App Address: CDQFBGQJKBREW5NCQDWV277PHCFI4WYVYGW26FHOZ4JBTO5PSRGQ4FVO
- Link: https://stellar.expert/explorer/testnet/contract/CDQFBGQJKBREW5NCQDWV277PHCFI4WYVYGW26FHOZ4JBTO5PSRGQ4FVO
<img src="images/Stellar Testnet.png" alt="Stellar Test Address" width="100%"/>

**Mainnet**
- Contract / App Address:

**Demo**
- Live App: https://migeltan.github.io/ad-astra-deploy/
- Demo Video: 
- Pitch Deck: https://canva.link/kwageebyadastra

## Optional Edge (Bonus)

- **Local anchor integration** — PDAX off-ramp for real-time PHP conversion on fund arrival
- **AI budget assistant** — suggests allocation adjustments based on spending history and upcoming contribution deadlines
- **Offline support** — invoice generation works without connectivity; syncs to Stellar ledger when reconnected

---

## 🧑‍💻 **Team**

| Name | Role | Github |
|------|------|--------|
| Isidro, James Patrick | Stellar Integration Lead | @isidrojp24 |
| Hernandez, Harold Benedict | Project Manager | @benhrnndz |
| Nuesca, Geena Mae | Frontend & UI Developer | @eenami |
| Tan, Migel | Product, Documentation & GitHub Lead | @migeltan |
| Villegas, Kezia Lorein | Smart Contract & Soroban Lead | @kezein |

---

## ⏰ **Timeline**

| Phase | Milestone |
|-------|-----------|
| Day 0 | Brainstorming |
| Day 1 | Soroban contract scaffold, invoice registry, allocation logic |
| Day 2 | Freighter Wallet integration, frontend split-dashboard |
| Day 3 | USDC payment flow, multi-destination disbursement |

---

## License

MIT © 2026 Kwagee Team
