require("dotenv").config();
const {
  Keypair, Contract, TransactionBuilder, Networks,
  BASE_FEE, nativeToScVal, Address, xdr
} = require("@stellar/stellar-sdk");
const { Server } = require("@stellar/stellar-sdk/rpc");

// ── Config ─────────────────────────────────────────────────────────────────
const CONTRACT_ID = "CD3MWWD7PZF5IFB3EBOUT5LXMVKT2PAAUN74LELFK6BCNJTE2SRYXSE6";
const server = new Server("https://soroban-testnet.stellar.org");

const workerPair = Keypair.fromSecret("SADJYF73BF2OB3IMIHXGQFVBTDWUBDINNS74DQ4LL4MGH3SC4E7MBZHJ");
const clientPair = Keypair.fromSecret("SDVXW5DQCSLP7NANJPQK4YW3G2TG3WILAQA7RFXBUO564XBA6XQNGEYO");

// ── Helper ─────────────────────────────────────────────────────────────────
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

// ── STEP 1: Set Fixed Budget ───────────────────────────────────────────────
async function setFixedBudget() {
  console.log("\n⏳ STEP 1: Setting fixed budget...");

  const contract = new Contract(CONTRACT_ID);
  await sendAndConfirm(
    workerPair,
    contract.call(
      "set_fixed_budget",
      new Address(workerPair.publicKey()).toScVal(),
      nativeToScVal(20 * 10_000_000, { type: "i128" }) // 20 USDC fixed budget
    )
  );
  console.log("✅ Fixed budget set! (20 USDC goes to budget, rest to savings)");
}

// ── STEP 2: Set Allocations ────────────────────────────────────────────────
async function setAllocations() {
  console.log("\n⏳ STEP 2: Setting budget allocations...");

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
        val: nativeToScVal("PhilHealth", { type: "string" }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal("percent", { type: "symbol" }),
        val: nativeToScVal(10, { type: "u32" }),
      }),
    ]),
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: nativeToScVal("label", { type: "symbol" }),
        val: nativeToScVal("Bills", { type: "string" }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal("percent", { type: "symbol" }),
        val: nativeToScVal(30, { type: "u32" }),
      }),
    ]),
    xdr.ScVal.scvMap([
      new xdr.ScMapEntry({
        key: nativeToScVal("label", { type: "symbol" }),
        val: nativeToScVal("Savings", { type: "string" }),
      }),
      new xdr.ScMapEntry({
        key: nativeToScVal("percent", { type: "symbol" }),
        val: nativeToScVal(50, { type: "u32" }),
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
  console.log("✅ Allocations set! SSS 10%, PhilHealth 10%, Bills 30%, Savings 50%");
}

// ── STEP 3: Create Invoice ─────────────────────────────────────────────────
async function createInvoice() {
  console.log("\n⏳ STEP 3: Creating invoice...");

  const contract = new Contract(CONTRACT_ID);
  const response = await sendAndConfirm(
    workerPair,
    contract.call(
      "create_invoice",
      new Address(workerPair.publicKey()).toScVal(),
      new Address(clientPair.publicKey()).toScVal(),
      nativeToScVal(100 * 10_000_000, { type: "i128" }), // 100 USDC
      nativeToScVal("Freelance Work - Kwagee Project", { type: "string" })
    )
  );

  let invoiceId = null;
  try {
    invoiceId = Number(response.returnValue.value());
    console.log(`✅ Invoice created! ID: ${invoiceId}`);
  } catch {
    console.log("✅ Invoice created!");
  }

  return invoiceId;
}

// ── STEP 4: Pay Invoice ────────────────────────────────────────────────────
async function payInvoice(invoiceId) {
  console.log(`\n⏳ STEP 4: Client paying invoice #${invoiceId}...`);

  const contract = new Contract(CONTRACT_ID);
  await sendAndConfirm(
    clientPair,
    contract.call(
      "pay_invoice",
      new Address(clientPair.publicKey()).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" })
    )
  );
  console.log("✅ Invoice paid! Funds distributed to buckets!");
}

// ── STEP 5: Get Buckets ────────────────────────────────────────────────────
async function getBuckets() {
  console.log("\n⏳ STEP 5: Checking worker buckets...");

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

  const result = await server.simulateTransaction(tx);

  if (result.error) throw new Error(`Simulation failed: ${result.error}`);

  try {
    const buckets = result.result.retval.value().map(entry => ({
      label: Buffer.from(entry.key().value()).toString(),
      balance: Number(entry.val().value().lo().toBigInt()) / 10_000_000
    }));

    console.log("✅ Buckets retrieved!");
    console.log("\n💰 Worker Buckets:");
    buckets.forEach(b => console.log(`   ${b.label}: ${b.balance} USDC`));
  } catch {
    console.log("✅ Buckets retrieved!");
    console.log("📦 Raw:", JSON.stringify(result.result?.retval, null, 2));
  }
}

// ── RUN ALL ────────────────────────────────────────────────────────────────
async function runAll() {
  try {
    await setFixedBudget();
    await setAllocations();
    const invoiceId = await createInvoice();
    if (invoiceId !== null) {
      await payInvoice(invoiceId);
    } else {
      await payInvoice(1);
    }
    await getBuckets();
    console.log("\n🎉 All steps completed!");
  } catch (err) {
    console.error("\n❌ Error:", err.message);
  }
}

runAll();