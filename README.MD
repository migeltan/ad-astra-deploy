# Kwagee # <img src="3.png" width="32"/>
### * Kwagee: Owl You Need!*

> A Stellar-powered payroll and on-chain budgeting platform built for Filipino freelancers and remote workers — settling international payments in seconds, converting funds transparently, and automatically distributing them across customizable budget wallets for rent, bills, taxes, SSS, and PhilHealth.

---

## Problem

Harold, a 20-year-old freelance video editor in Makati City contracting for clients in SEA, watches his electric bill lapse for the third consecutive month because SWIFT delays, hidden exchange spreads, and platform fees quietly drain his transfer before it arrives — leaving him too short to cover utilities and a PhilHealth contribution he's been deferring since January, manually reconciling invoices for BIR filings with no HR support, no fixed payroll cycle, and no margin for error in a global payment system that was never built for him.

---

## Solution

Kwagee solves the broken cross-border payroll experience by letting Filipino freelancers receive client payments directly in XLM or USDC on the Stellar blockchain, instantly converting funds to Philippine Peso at transparent rates, and automatically distributing them across customizable on-chain budget wallets — covering rent, bills, taxes, SSS, PhilHealth, and savings — all settled in seconds, at near-zero cost, with no SWIFT delays, no hidden fees, and no HR department required.

---

## Stellar Features Used

- **Stellar USDC / XLM transfers** — lightning-fast 3–5 second cross-border invoice settlement for fractions of a cent
- **Soroban smart contracts** — manages active invoice registries, tracks user-defined allocation weights, and stores funding states on-chain
- **Freighter Wallet** — secure wallet connection, cryptographic signing for invoice updates, and multi-destination transaction approvals
- **Compliance Anchors** — transaction outputs stream funds to local off-ramp entities (e.g. PDAX) for smooth conversion to Philippine Peso (PHP)
- **Trustlines** — manages asset permissions between sender, contract, and recipient wallets

---

## Target Users

| User | Location | Why They Care |
|------|----------|---------------|
| Filipino freelancers & remote workers | Quezon City, Manila, Cebu City | Delayed transfers, hidden fees, and missing HR support create unstable cash flow and skipped government contributions |
| International employers & startup teams | Global (Canada, Singapore, SEA) | Need a faster, lower-cost, and more reliable payroll system for managing overseas contractors |

---

## Core Feature (MVP)

**Invoice → On-Chain Split → Wallet Distribution**

1. **Client action** — International client sends USDC/XLM payment to a Kwagee-generated invoice address
2. **On-chain action** — Soroban contract validates the invoice, reads the freelancer's pre-set allocation weights (e.g. 40% rent, 20% savings, 15% SSS/PhilHealth, 25% bills), and executes multi-destination disbursement atomically
3. **Result** — Freelancer's budget wallets are funded instantly, contributions are scheduled automatically, and a transparent transaction record is written to the Stellar ledger — no manual reconciliation required

> Demo-able in under 2 minutes: submit invoice → confirm payment → view wallet breakdown.

---

## Vision & Purpose

Kwagee takes its name from *Kuwago* — the Filipino word for owl, a symbol of wisdom, wealth, and awareness. The platform is proudly rooted in Philippine culture, built to give the country's growing class of digital workers the financial infrastructure they deserve: fast, transparent, automated, and entirely on-chain. By anchoring Kwagee to the Stellar ecosystem, we bridge the gap between traditional remittance finance and the programmable financial future — one paycheck at a time.

**Kwagee – Own Your Financial Flight**

---

## Why This Wins

Kwagee targets a massive, underserved real-world segment — Filipino freelancers generating billions in annual cross-border income — and demonstrates Stellar's composability through a full PayFi workflow: cross-border settlement, on-chain budgeting, and automated government contribution scheduling, all in a single demo-able flow. It directly addresses Stellar's Stablecoins & PayFi and MSME Commerce tracks while grounding every design decision in a human story judges can immediately understand.

---

## Team

| Name | Role |
|------|------|
| Isidro, James Patrick | Stellar Integration Lead |
| Hernandez, Harold Benedict | Project Manager |
| Nuesca, Geena Mae | Frontend & UI Developer |
| Tan, Migel | Product, Documentation & GitHub Lead |
| Villegas, Kezia Lorein | Smart Contract & Soroban Lead |

---

## Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup) `v22.x`
- [Node.js](https://nodejs.org/) `v18+` (for frontend)
- [Freighter Wallet](https://www.freighter.app/) browser extension

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

## Deploy to Testnet

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

## Optional Edge (Bonus)

- **Local anchor integration** — PDAX off-ramp for real-time PHP conversion on fund arrival
- **AI budget assistant** — suggests allocation adjustments based on spending history and upcoming contribution deadlines
- **Offline support** — invoice generation works without connectivity; syncs to Stellar ledger when reconnected

---

## Timeline

| Phase | Milestone |
|-------|-----------|
| Day 1 | Soroban contract scaffold, invoice registry, allocation logic |
| Day 2 | Freighter Wallet integration, frontend split-dashboard |
| Day 3 | USDC payment flow, multi-destination disbursement |
| Day 4 | PDAX anchor integration, BIR reconciliation export |
| Day 5 | End-to-end testing, testnet deployment, demo prep |

---

## License

MIT © 2026 Kwagee Team
