const StellarSdk = require("@stellar/stellar-sdk");

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

const pair = StellarSdk.Keypair.fromSecret("SADJYF73BF2OB3IMIHXGQFVBTDWUBDINNS74DQ4LL4MGH3SC4E7MBZHJ");
async function sendTransaction() {
  try {
    console.log("⏳ Loading account...");
    const account = await server.loadAccount(pair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: "GC2WNMONVHE5XWIUIMSAVVZ7NYKGWMCMHSI5JP24ZIH7FRTJ3I24IRJG",
          asset: StellarSdk.Asset.native(),
          amount: "10",
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(pair);

    console.log("⏳ Submitting transaction...");
    const result = await server.submitTransaction(transaction);

    console.log("✅ Transaction successful!");
    console.log("🔗 TX Hash:", result.hash);
    console.log(`\n📸 View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
  }
}

sendTransaction();