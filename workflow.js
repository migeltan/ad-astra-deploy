require("dotenv").config();
const { Keypair, Contract, TransactionBuilder, Networks, BASE_FEE, nativeToScVal, Address, xdr } = require("@stellar/stellar-sdk");
const { Server } = require("@stellar/stellar-sdk/rpc");

const CONTRACT_ID = "CDQOBACPTRVMNOJMD2NFNNNTZJ4YTQCGFR6N5OKM7643CGBFZ2KGCTLT";
const server = new Server("https://soroban-testnet.stellar.org");

// YOUR wallet = Worker
const workerPair = Keypair.fromSecret("SADJYF73BF2OB3IMIHXGQFVBTDWUBDINNS74DQ4LL4MGH3SC4E7MBZHJ");

// GROUPMATE wallet = Client (ask her public key & secret)
const clientPair = Keypair.fromSecret("SDVXW5DQCSLP7NANJPQK4YW3G2TG3WILAQA7RFXBUO564XBA6XQNGEYO");

async function callContract(signerPair, method, ...args) {
  const account = await server.getAccount(signerPair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(signerPair);
  const result = await server.sendTransaction(prepared);
  return result;
}

// STEP 1 - Worker sets budget allocations
async function setAllocations() {
  console.log("\n⏳ STEP 1: Setting budget allocations...");
  // SSS 10%, PhilHealth 5%, PagIBIG 5%, Bills 20%, Savings 60%
  const allocations = xdr.ScVal.scvVec([
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({ key: nativeToScVal("label", { type: "symbol" }), val: nativeToScVal("SSS", { type: "string" }) }),
      new xdr.ScMapEntry({ key: nativeToScVal("percent", { type: "symbol" }), val: nativeToScVal(10, { type: "u32" }) }),
    ]),
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({ key: nativeToScVal("label", { type: "symbol" }), val: nativeToScVal("Savings", { type: "string" }) }),
      new xdr.ScMapEntry({ key: nativeToScVal("percent", { type: "symbol" }), val: nativeToScVal(90, { type: "u32" }) }),
    ]),
  ]);

  const result = await callContract(
    workerPair,
    "set_allocations",
    new Address(workerPair.publicKey()).toScVal(),
    allocations
  );
  console.log("✅ Allocations set!");
  console.log("🔗 TX:", result.hash);
  console.log(`📸 View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
}

// STEP 2 - Worker creates invoice
async function createInvoice() {
  console.log("\n⏳ STEP 2: Worker creating invoice...");
  const result = await callContract(
    workerPair,
    "create_invoice",
    new Address(workerPair.publicKey()).toScVal(),
    new Address(clientPair.publicKey()).toScVal(),
    nativeToScVal(100 * 10_000_000, { type: "i128" }),
    nativeToScVal("Freelance Work - Ad Astra Project", { type: "string" })
  );
  console.log("✅ Invoice created!");
  console.log("🔗 TX:", result.hash);
  console.log(`📸 View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
}

// STEP 3 - Client pays invoice
async function payInvoice(invoiceId) {
  console.log("\n⏳ STEP 3: Client paying invoice...");
  const result = await callContract(
    clientPair,
    "pay_invoice",
    new Address(clientPair.publicKey()).toScVal(),
    nativeToScVal(invoiceId, { type: "u64" })
  );
  console.log("✅ Invoice paid!");
  console.log("🔗 TX:", result.hash);
  console.log(`📸 View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
}

// STEP 4 - Check worker's buckets
async function getBuckets() {
  console.log("\n⏳ STEP 4: Checking worker buckets...");
  const account = await server.getAccount(workerPair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        "get_buckets",
        new Address(workerPair.publicKey()).toScVal()
      )
    )
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(workerPair);
  const result = await server.sendTransaction(prepared);
  console.log("✅ Buckets retrieved!");
  console.log("🔗 TX:", result.hash);
  console.log(`📸 View: https://stellar.expert/explorer/testnet/tx/${result.hash}`);
}

// RUN ALL STEPS
async function runAllFlows() {
  try {
    await setAllocations();
    await createInvoice();
    await payInvoice(2); // invoice ID 2 (since ID 1 was already created)
    await getBuckets();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

runAllFlows();