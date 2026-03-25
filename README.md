# encrypted-identity-mxe — zkKYC on Arcium

> Identity attributes verified inside Arcium MXE. Compliance result (boolean) stored on-chain. No PII ever written to Solana.

[![Solana Devnet](https://img.shields.io/badge/Solana-devnet-9945FF)](https://explorer.solana.com/address/3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV?cluster=devnet)
[![Arcium MXE](https://img.shields.io/badge/Arcium-MXE%20cluster%20456-00D4FF)](https://arcium.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-orange)](https://anchor-lang.com)
[![arcium-client](https://img.shields.io/badge/arcium--client-0.9.3-blue)](https://www.npmjs.com/package/@arcium-hq/client)

---

## Deployed Program

| Network | Program ID |
|---|---|
| **Solana Devnet** | [`3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV`](https://explorer.solana.com/address/3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV?cluster=devnet) |
| MXE Cluster | offset `456` (Arcium devnet) |

---

## What It Does

`add_together` (used as compliance verification) takes two encrypted identity attributes (e.g., age proof + residency flag), verifies them inside the MXE, and emits an encrypted compliance result. The Solana program stores only a boolean outcome — never the underlying PII.

```
User: encrypt(age_proof) + encrypt(residency_flag)
        │  encrypted with MXE public key before submission
        ▼
Solana: add_together instruction
        │  ciphertexts queued for cluster 456
        ▼
Arcium MXE
        │  runs compliance rules on encrypted attributes
        │  e.g., age >= 18 AND jurisdiction == eligible
        ▼
Solana: callback
        │  emits SumEvent { result: encrypted_compliance }
        ▼
DeFi protocol: verify_compliance(userPubkey) → true/false
```

**What is NEVER on-chain**: name, DOB, document numbers, address, any raw PII.

**What IS on-chain**: encrypted compliance proof + MXE computation hash.

---

## Quick Start

```bash
git clone https://github.com/gnoesy/encrypted-identity-mxe
cd encrypted-identity-mxe
yarn install

ANCHOR_WALLET=~/.config/solana/devnet.json \
npx ts-node --transpile-only scripts/run_demo.ts
```

Expected output:
```json
{"event":"demo_start","description":"zkKYC: identity attributes encrypted, compliance verified in MXE"}
{"event":"identity_attributes","age_proof":"encrypted","residency_proof":"encrypted","pii_on_chain":"none"}
{"event":"kyc_queued","sig":"...","explorer":"https://explorer.solana.com/tx/...?cluster=devnet"}
```

---

## On-chain Instructions

| Instruction | Description |
|---|---|
| `init_add_together_comp_def` | Register computation definition (run once) |
| `add_together` | Queue identity verification with two attribute ciphertexts |
| `add_together_callback` | MXE callback — emits encrypted compliance result |

---

## What Is Never On-Chain

| Attribute | Status |
|---|---|
| Name, DOB, address | Never submitted |
| Document numbers | Never submitted |
| Raw age or residency data | Encrypted before submission |
| Compliance logic rules | Executed inside MXE only |

---

## Project Structure

```
encrypted-identity-mxe/
├── programs/encrypted_identity/src/lib.rs  # Solana program
├── encrypted-ixs/src/lib.rs                # ARCIS compliance circuit
├── scripts/
│   └── run_demo.ts                         # Demo: zkKYC verification flow
├── build/
│   └── add_together.arcis                  # Compiled ARCIS circuit
├── Anchor.toml
└── Arcium.toml                             # cluster offset: 456
```

---

## Related MXE Programs

| Program | Program ID |
|---|---|
| [hello-world-mxe](https://github.com/gnoesy/hello-world-mxe) | `3TysCyYXyWpqNXDnQiwA4C2KiMSxGmBbTJADtGwFVeLr` |
| [encrypted-defi-mxe](https://github.com/gnoesy/encrypted-defi-mxe) | `AmzMmGcKUqMWf57WPXhHBkE9QzrbXCc1emFK6hsVJTj7` |
| [private-voting-mxe](https://github.com/gnoesy/private-voting-mxe) | `S43YKqU6x229PdY5oUssPoD2UgH4EDUvugYos6WxvDY` |
| [encrypted-voting-mxe](https://github.com/gnoesy/encrypted-voting-mxe) | `FoCgMmXj37JaMcbYrAnBDCWaaQE6FYzEBzMuAkXBZ7XF` |

---

## Devnet Explorer

- [Program](https://explorer.solana.com/address/3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV?cluster=devnet)
- [Deployer](https://explorer.solana.com/address/4Y8R73V9QpmL2oUtS4LrwdZk3LrPRCLp7KGg2npPkB1u?cluster=devnet)
