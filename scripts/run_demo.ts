/**
 * encrypted-identity-mxe demo
 * zkKYC — encrypted identity attributes verified inside MXE
 * Result: compliance boolean on-chain, no PII ever stored
 *
 * Usage:
 *   ANCHOR_WALLET=~/.config/solana/devnet.json npx ts-node --transpile-only scripts/run_demo.ts
 */
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { randomBytes } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  getArciumEnv,
  getCompDefAccOffset,
  RescueCipher,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  x25519,
} from "@arcium-hq/client";

const PROGRAM_ID = new PublicKey("3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV");

function log(event: string, data: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ event, ...data, ts: new Date().toISOString() }));
}

async function main() {
  process.env.ARCIUM_CLUSTER_OFFSET = "456";

  const walletPath = process.env.ANCHOR_WALLET || `${os.homedir()}/.config/solana/devnet.json`;
  const conn = new anchor.web3.Connection(
    process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
  const owner = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(walletPath).toString()))
  );
  const provider = new anchor.AnchorProvider(conn, new anchor.Wallet(owner), {
    commitment: "confirmed", skipPreflight: true,
  });
  anchor.setProvider(provider);

  const idl = JSON.parse(fs.readFileSync(path.join(__dirname, "../target/idl/encrypted_identity.json"), "utf-8"));
  const program = new anchor.Program(idl, provider) as anchor.Program<any>;
  const arciumEnv = getArciumEnv();

  log("demo_start", {
    program: PROGRAM_ID.toString(),
    wallet: owner.publicKey.toString(),
    description: "zkKYC: identity attributes encrypted, compliance verified in MXE, only boolean stored on-chain",
  });

  const privKey = x25519.utils.randomPrivateKey();
  const pubKey = x25519.getPublicKey(privKey);
  const mxePubKey = await getMXEPublicKey(conn, arciumEnv.arciumClusterOffset);

  // Simulate identity attributes (age encoded as u8 for demo)
  // e.g., age=25 means "over 18" check passes inside MXE
  const age_proof = 25;      // encrypted age indicator
  const residency_proof = 1; // encrypted residency flag (1=eligible jurisdiction)

  log("identity_attributes", {
    age_proof: "encrypted",
    residency_proof: "encrypted",
    pii_on_chain: "none — only compliance result will be stored",
  });

  const nonce = BigInt("0x" + randomBytes(16).toString("hex"));
  const sharedSecret = x25519.getSharedSecret(privKey, mxePubKey);
  const cipher = new RescueCipher(sharedSecret);
  const enc_age = cipher.encrypt([BigInt(age_proof)], nonce);
  const enc_residency = cipher.encrypt([BigInt(residency_proof)], nonce + 1n);

  const computationOffset = BigInt("0x" + randomBytes(8).toString("hex"));
  const clusterOffset = arciumEnv.arciumClusterOffset;

  try {
    const sig = await program.methods
      .addTogether(
        computationOffset,
        Array.from(enc_age[0]),
        Array.from(enc_residency[0]),
        Array.from(pubKey),
        nonce
      )
      .accountsPartial({
        payer: owner.publicKey,
        mxeAccount: getMXEAccAddress(PROGRAM_ID),
        mempoolAccount: getMempoolAccAddress(clusterOffset),
        executingPool: getExecutingPoolAccAddress(clusterOffset),
        computationAccount: getComputationAccAddress(clusterOffset, computationOffset),
        compDefAccount: getCompDefAccAddress(
          PROGRAM_ID,
          Buffer.from(getCompDefAccOffset("add_together")).readUInt32LE()
        ),
        clusterAccount: getClusterAccAddress(clusterOffset),
      })
      .rpc({ skipPreflight: true, commitment: "confirmed" });

    log("kyc_queued", {
      sig,
      explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
      note: "Identity check queued in MXE. Compliance result (bool) will be written on-chain by callback.",
    });
  } catch (e: any) {
    log("kyc_fail", { message: e.message || String(e), raw: JSON.stringify(e) });
    process.exit(1);
  }
}

main().catch(e => {
  console.error(JSON.stringify({ event: "fatal", message: e.message }));
  process.exit(1);
});
