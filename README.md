# encrypted-identity-mxe — zkKYC on Arcium

> Identity attributes verified inside Arcium MXE. Compliance result (boolean) stored on-chain. No PII ever written to Solana.

[![Solana Devnet](https://img.shields.io/badge/Solana-devnet-9945FF)](https://explorer.solana.com/address/WAV5kgMtb2DZtsC5xmdZVLtzzu9yJSJjW95EXeSMq97?cluster=devnet)
[![Arcium MXE](https://img.shields.io/badge/Arcium-MXE%20cluster%20456-00D4FF)](https://arcium.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.32.1-orange)](https://anchor-lang.com)
[![arcium-client](https://img.shields.io/badge/arcium--client-0.9.3-blue)](https://www.npmjs.com/package/@arcium-hq/client)

---

## Deployed Program

| Network | Program ID |
|---|---|
| **Solana Devnet** | [`WAV5kgMtb2DZtsC5xmdZVLtzzu9yJSJjW95EXeSMq97`](https://explorer.solana.com/address/WAV5kgMtb2DZtsC5xmdZVLtzzu9yJSJjW95EXeSMq97?cluster=devnet) |
| MXE Cluster | offset `456` (Arcium devnet) |

---

## Legacy Continuity

This repo originally operated against a legacy devnet MXE path on cluster `69420`:

- legacy program id: `3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV`

That legacy MXE entered a stuck keygen state. To preserve the use case and restore live devnet execution, the project was freshly cut over onto the canonical devnet cluster `456` with a new active program id. The legacy id is preserved in docs and evidence as a continuity reference rather than deleted history.

---

## What It Does

`verify_identity_v2` (used as compliance verification) takes two encrypted identity attributes (e.g., age proof + residency flag), verifies them inside the MXE, and emits an encrypted compliance result. The Solana program stores only a boolean outcome — never the underlying PII.

```
User: encrypt(age_proof) + encrypt(residency_flag)
        │  encrypted with MXE public key before submission
        ▼
Solana: verify_identity_v2 instruction
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
| `init_verify_identity_v2_comp_def` | Register computation definition (run once) |
| `verify_identity_v2` | Queue identity verification with two attribute ciphertexts |
| `verify_identity_v2_callback` | MXE callback — emits encrypted compliance result |

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
│   └── verify_identity_v2.arcis            # Compiled ARCIS circuit
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
| [encrypted-voting-mxe](https://github.com/gnoesy/encrypted-voting-mxe) | `GQZv1j3V2sHsZsipyiN9yf6iVYKbBYQLfsWAo87ggVrj` |

---

## Devnet Explorer

- [Program](https://explorer.solana.com/address/WAV5kgMtb2DZtsC5xmdZVLtzzu9yJSJjW95EXeSMq97?cluster=devnet)
- [Deployer](https://explorer.solana.com/address/4Y8R73V9QpmL2oUtS4LrwdZk3LrPRCLp7KGg2npPkB1u?cluster=devnet)
- [Legacy Program (69420 path)](https://explorer.solana.com/address/3zYA4ykzGofqeH6m6aET46AQNgBVtEa2XotAVX6TXgBV?cluster=devnet)
