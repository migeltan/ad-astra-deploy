import {
  Keypair, Contract, TransactionBuilder, Transaction, Networks,
  BASE_FEE, nativeToScVal, Address, xdr
} from '@stellar/stellar-sdk';
import { Server } from '@stellar/stellar-sdk/rpc';

// ── Config ──────────────────────────────────────────────────────────────────
const CONTRACT_ID = "CD3MWWD7PZF5IFB3EBOUT5LXMVKT2PAAUN74LELFK6BCNJTE2SRYXSE6";
const server = new Server("https://soroban-testnet.stellar.org");

const workerPair = Keypair.fromSecret("SADJYF73BF2OB3IMIHXGQFVBTDWUBDINNS74DQ4LL4MGH3SC4E7MBZHJ");
const clientPair = Keypair.fromSecret("SDVXW5DQCSLP7NANJPQK4YW3G2TG3WILAQA7RFXBUO564XBA6XQNGEYO");


export const WORKER_PUBLIC = workerPair.publicKey();
export const CLIENT_PUBLIC = clientPair.publicKey();

// ── Helper ───────────────────────────────────────────────────────────────────
async function sendAndConfirm(signerPair, operation, onLog) {
  onLog?.('📡 Connecting to Stellar testnet...');
  const account = await server.getAccount(signerPair.publicKey());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  onLog?.('🔧 Preparing transaction...');

  const simRes = await fetch('https://soroban-testnet.stellar.org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'simulateTransaction',
      params: { transaction: tx.toEnvelope().toXDR('base64') }
    })
  });
  const simData = await simRes.json();
  if (simData.error) throw new Error(`Simulate error: ${simData.error.message}`);
  if (simData.result.error) throw new Error(`Simulate failed: ${simData.result.error}`);

  const sim = simData.result;
const fee = String(parseInt(sim.minResourceFee) + parseInt(BASE_FEE));

const rebuiltTx = new TransactionBuilder(account, {
  fee,
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(operation)
  .setTimeout(180)
  .setSorobanData(sim.transactionData)
  .build();

// Attach auth entries from simulation
if (sim.results?.[0]?.auth) {
  const op = rebuiltTx.operations[0];
  op.auth = sim.results[0].auth.map(a => 
    xdr.SorobanAuthorizationEntry.fromXDR(a, 'base64')
  );
}

  rebuiltTx.sign(signerPair);

  onLog?.('🚀 Submitting to Stellar...');
  const xdrEnvelope = rebuiltTx.toEnvelope().toXDR('base64');

  const rpcRes = await fetch('https://soroban-testnet.stellar.org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'sendTransaction',
      params: { transaction: xdrEnvelope }
    })
  });

  const rpcData = await rpcRes.json();
  if (rpcData.error) throw new Error(`RPC Error: ${rpcData.error.message}`);

  const sent = rpcData.result;
  console.error('sent result:', JSON.stringify(sent, null, 2));
  if (sent.status === 'ERROR') throw new Error(`TX failed: ${JSON.stringify(sent)}`);
  const txHash = sent.hash;

  onLog?.('⏳ Waiting for ledger confirmation...');
  let response;
  do {
    await new Promise(r => setTimeout(r, 2000));
    response = await server.getTransaction(txHash);
  } while (response.status === 'NOT_FOUND');

  if (sent.status === 'ERROR') throw new Error(`TX failed: ${JSON.stringify(sent)}`);

  onLog?.(`✅ Ledger confirmed! TX: ${txHash}`);
  return { ...response, hash: txHash };
}

// ── Set Fixed Budget ──────────────────────────────────────────────────────────
export async function setFixedBudget(amountUsdc, onLog) {
  onLog?.('⏳ Setting fixed budget...');
  const contract = new Contract(CONTRACT_ID);
  const result = await sendAndConfirm(
    workerPair,
    contract.call(
      "set_fixed_budget",
      new Address(workerPair.publicKey()).toScVal(),
      nativeToScVal(Math.round(amountUsdc * 10_000_000), { type: "i128" })
    ),
    onLog
  );
  return result.hash;
}

// ── Set Allocations ───────────────────────────────────────────────────────────
export async function setAllocations(allocObj, onLog) {
  onLog?.('⏳ Setting allocations...');
  const labelMap = { gov: 'Gov', tax: 'Tax', bills: 'Bills', spendable: 'Spendable' };

  const allocations = xdr.ScVal.scvVec(
    Object.entries(allocObj).map(([key, percent]) =>
      xdr.ScVal.scvMap([
        new xdr.ScMapEntry({
          key: nativeToScVal("label", { type: "symbol" }),
          val: nativeToScVal(labelMap[key] || key, { type: "string" }),
        }),
        new xdr.ScMapEntry({
          key: nativeToScVal("percent", { type: "symbol" }),
          val: nativeToScVal(percent, { type: "u32" }),
        }),
      ])
    )
  );

  const contract = new Contract(CONTRACT_ID);
  const result = await sendAndConfirm(
    workerPair,
    contract.call(
      "set_allocations",
      new Address(workerPair.publicKey()).toScVal(),
      allocations
    ),
    onLog
  );
  return result.hash;
}

// ── Create Invoice ────────────────────────────────────────────────────────────
export async function createInvoice(amountUsdc, description, onLog) {
  onLog?.('⏳ Creating invoice...');
  const contract = new Contract(CONTRACT_ID);
  const response = await sendAndConfirm(
    workerPair,
    contract.call(
      "create_invoice",
      new Address(workerPair.publicKey()).toScVal(),
      new Address(clientPair.publicKey()).toScVal(),
      nativeToScVal(Math.round(amountUsdc * 10_000_000), { type: "i128" }),
      nativeToScVal(description || "Freelance Work - Kwagee Project", { type: "string" })
    ),
    onLog
  );

  let invoiceId = 1;
  try { invoiceId = Number(response.returnValue.value()); } catch {}
  return { invoiceId, hash: response.hash };
}

// ── Pay Invoice ───────────────────────────────────────────────────────────────
export async function payInvoice(invoiceId, onLog) {
  onLog?.('⏳ Client paying invoice...');
  const contract = new Contract(CONTRACT_ID);
  const result = await sendAndConfirm(
    clientPair,
    contract.call(
      "pay_invoice",
      new Address(clientPair.publicKey()).toScVal(),
      nativeToScVal(invoiceId, { type: "u64" })
    ),
    onLog
  );
  return result.hash;
}

// ── Get Buckets ───────────────────────────────────────────────────────────────
export async function getBuckets() {
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

  const buckets = result.result.retval.value().map(entry => {
    const keyBytes = entry.key().value();
    const label = new TextDecoder().decode(keyBytes);
    const balance = Number(entry.val().value().lo().toBigInt()) / 10_000_000;
    return { label, balance };
  });

  return buckets;
}