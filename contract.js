require("dotenv").config();
const {
  Keypair, Contract, TransactionBuilder, Networks,
  BASE_FEE, nativeToScVal, Address, xdr
} = require("@stellar/stellar-sdk");
const { Server } = require("@stellar/stellar-sdk/rpc");

const CONTRACT_ID = "CDQOBACPTRVMNOJMD2NFNNNTZJ4YTQCGFR6N5OKM7643CGBFZ2KGCTLT";
const server = new Server("https://soroban-testnet.stellar.org");

const workerPair = Keypair.fromSecret("SADJYF73BF2OB3IMIHXGQFVBTDWUBDINNS74DQ4LL4MGH3SC4E7MBZHJ");
const clientPair = Keypair.fromSecret("SDVXW5DQCSLP7NANJPQK4YW3G2TG3WILAQA7RFXBUO564XBA6XQNGEYO");

// ── Helper: send tx and wait for confirmation ──────────────────────────────
async function sendAndConfirm(signerPair, operation) {
  const account = await server.getAccount(signerPair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  const prepared = await server.prepareTransaction(tx);
  prepared.sign(signerPair);
  const sent = await server.sendTransaction(prepared);

  if (sent.status === "ERROR") {
    throw new Error(`TX failed: ${JSON.stringify(sent.errorResult)}`);
  }

  console.log(`   🔗 TX: https://stellar.expert/explorer/testnet/tx/${sent.hash}`);

  // Poll until confirmed
  let response;
  do {
    await new Promise(r => setTimeout(r, 2000));
    response = await server.getTransaction(sent.hash);
  } while (response.status === "NOT_FOUND");

  if (response.status === "FAILED") {
    throw new Error(`TX failed on chain: ${response.status}`);
  }

  return response;
}

// ── STEP 1: Set Allocations ────────────────────────────────────────────────
async function setAllocations() {
  console.log("\n⏳ STEP 1: Setting budget allocations...");

  const allocations = xdr.ScVal.scvVec([
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: nativeToScVal("label", { type: "symbol" }),
        val: nativeToScVal("SSS", { type: "string" }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal("percent", { type: "symbol" }),
        val: nativeToScVal(10, { type: "u32" }),
      }),
    ]),
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: nativeToScVal("label", { type: "symbol" }),
        val: nativeToScVal("Savings", { type: "string" }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal("percent", { type: "symbol" }),
        val: nativeToScVal(90, { type: "u32" }),
      }),
    ]),
  ]);

  const contract = new Contract(CONTRACT_ID);
  await sendAndConfirm(
    workerPair,
    contract.call(
      "set_allocations",
      new Address(workerPair.publicKey()).toScVal(),
      allocations
    )
  );
  console.log("✅ Allocations set!");
}

// ── STEP 2: Create Invoice ─────────────────────────────────────────────────
async function createInvoice() {
  console.log("\n⏳ STEP 2: Creating invoice...");

  const contract = new Contract(CONTRACT_ID);
  const response = await sendAndConfirm(
    workerPair,
    contract.call(
      "create_invoice",
      new Address(workerPair.publicKey()).toScVal(),  // worker
      new Address(clientPair.publicKey()).toScVal(),  // client
      nativeToScVal(100 * 10_000_000, { type: "i128" }), // 100 XLM
      nativeToScVal("Freelance Work - Ad Astra Project", { type: "string" })
    )
  );

  // Extract invoice ID from return value
  let invoiceId = null;
  try {
    const returnVal = response.returnValue;
    invoiceId = Number(returnVal.value());
    console.log(`✅ Invoice created! ID: ${invoiceId}`);
  } catch {
    console.log("✅ Invoice created! (could not parse ID from return value)");
  }

  return invoiceId;
}

// ── STEP 3: Pay Invoice ────────────────────────────────────────────────────
async function payInvoice(invoiceId) {
  console.log(`\n⏳ STEP 3: Client paying invoice #${invoiceId}...`);

  const contract = new Contract(CONTRACT_ID);
  await sendAndConfirm(
    clientPair,
    contract.call(
      "pay_invoice",
      new Address(clientPair.publicKey()).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" })
    )
  );
  console.log("✅ Invoice paid!");
}

// ── STEP 4: Get Buckets ────────────────────────────────────────────────────
async function getBuckets() {
  console.log("\n⏳ STEP 4: Checking worker buckets...");

  const account = await server.getAccount(workerPair.publicKey());
  const contract = new Contract(CONTRACT_ID);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call("get_buckets", new Address(workerPair.publicKey()).toScVal())
    )
    .setTimeout(180)
    .build();

  // Read-only: simulate instead of send
  const result = await server.simulateTransaction(tx);

  if (result.error) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  console.log("✅ Buckets retrieved!");
  console.log("📦 Raw result:", JSON.stringify(result.result?.retval, null, 2));
}

// ── RUN ALL ────────────────────────────────────────────────────────────────
async function runAll() {
  try {
    await setAllocations();
    const invoiceId = await createInvoice();

    if (invoiceId !== null) {
      await payInvoice(invoiceId);
    } else {
      // Fallback: manually set the invoice ID if parsing failed
      console.log("⚠️  Could not auto-detect invoice ID. Edit line below and re-run from STEP 3.");
      await payInvoice(1); // ← change this if needed
    }

    await getBuckets();
    console.log("\n🎉 All steps completed!");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
  }
}

runAll();