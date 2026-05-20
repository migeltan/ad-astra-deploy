# 🚀 Ad Astra — Stellar Testnet Wallet

A modern web platform integrated with the Stellar network, built and tested on the Stellar Testnet.

---

## 📌 Project Overview

This project demonstrates a functional Stellar wallet integration using the Stellar SDK. It covers keypair generation, account funding, and transaction submission on the Stellar Testnet.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **SDK:** @stellar/stellar-sdk
- **Network:** Stellar Testnet / Mainnet
- **Explorer:** Stellar Expert
- **Wallet:** Freighter (for browser wallet simulation)

---

## ⚙️ Setup & Installation

### 1. Clone the repository
git clone https://github.com/isidrojp24/ad-astra.git
cd ad-astra

### 2. Install dependencies
npm install

### 3. Configure environment variables
Create a `.env` file in the root directory:
SECRET_KEY=your_secret_key_here
PUBLIC_KEY=your_public_key_here

### 4. Run the wallet
node index.js

---

## 🌐 Wallet Features

- ✅ Generate Stellar keypair (Public & Secret Key)
- ✅ Connect to Stellar Testnet via Horizon API
- ✅ Fund account using Friendbot (Testnet only)
- ✅ Check account balance
- ✅ Send XLM transactions
- ✅ Verify transactions on Stellar Expert Explorer

---

## 🧪 Testnet Deployment

**Testnet Account:**
GC2WNMONVHE5XWIUIMSAVVZ7NYKGWMCMHSI5JP24ZIH7FRTJ3I24IRJG

**Testnet Explorer:**
https://stellar.expert/explorer/testnet/account/GC2WNMONVHE5XWIUIMSAVVZ7NYKGWMCMHSI5JP24ZIH7FRTJ3I24IRJG

**Sample Transaction (Testnet):**
https://stellar.expert/explorer/testnet/tx/11f6563e0e51eee611bf917d0b2308200245ef2d2cf6e6dfb7369c3107b7f64c

---

## 🔗 Network Configuration

| Setting | Testnet | Mainnet |
|---|---|---|
| Horizon URL | https://horizon-testnet.stellar.org | https://horizon.stellar.org |
| Network Passphrase | Test SDF Network ; September 2015 | Public Global Stellar Network ; September 2015 |
| Explorer | stellar.expert/explorer/testnet | stellar.expert/explorer/public |
| Free Funding | Friendbot available | Real XLM required |

---

## 📁 Project Structure

ad-astra/
├── index.js          # Main wallet script
├── package.json      # Dependencies
├── .env              # Environment variables (not committed)
├── .gitignore        # Git ignore rules
└── README.md         # Project documentation

---

## 🔒 Security Notes

- Never commit your `.env` file
- Never share your Secret Key publicly
- The `.gitignore` excludes `.env` and `node_modules/`

---

## 👥 Team

**Ad Astra** — Group Project
GitHub: [@isidrojp24](https://github.com/isidrojp24)

---

## 📄 License

ISC