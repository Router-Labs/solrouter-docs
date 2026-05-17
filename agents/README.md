# Solrouter Agent Privacy API

Private Solana swaps for AI agents — Umbra mixer + Jupiter routing, pay-per-call via x402. Mainnet only.

## What this is

A polished HTTP + MCP surface that lets any agent — ours or external — execute an end-to-end private swap with one HTTP call (or one MCP tool call). No SDK install for Umbra; no ZK prover in your stack; no Umbra wallet juggling. Three auth tiers, two custody modes, six discovery channels.

```
┌─────────────────────────────────────────────────────────────────┐
│ Discovery                                                        │
│   /.well-known/agent-card.json  · /.well-known/x402              │
│   /agents/v1/openapi.json       · MCP HTTP / stdio               │
│   @solrouter/agent-tools (npm)                                   │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ HTTP API  /agents/v1                                            │
│   x402 paywall · API-key auth · OFAC screening · bucketing       │
└─────────────────────────────────────────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Orchestrator (lib/umbra-server)                                 │
│   Node port of the in-chat Umbra flows. snarkjs Groth16 prover. │
│   Background worker; resumable via heartbeat lock.              │
└─────────────────────────────────────────────────────────────────┘
```

## Two custody modes

### Mode A — Managed Umbra wallet (recommended for trading agents)

`POST /agents/v1/wallets` provisions a server-held Umbra keypair, envelope-encrypted at rest (AES-256-GCM, KEK from Supabase Vault). Agent funds it, then runs many swaps. Audit log queryable. Source-side anonymity grows with reuse.

### Mode B — One-shot ephemeral wallet

`POST /agents/v1/swaps/oneshot` returns an unsigned `fundingTx` for the agent to sign with their existing wallet, plus a session id. Server runs the entire mixer + Jupiter flow on a per-call ephemeral, lands output at `destinationPubkey`, wipes the keypair. Destination unlinkability only — chain still sees `payerPubkey → ephemeralPubkey`.

## State machine

```
created ─funding tx confirmed────► funded
funded ─register OK──────────────► registered
registered ─createUtxo OK────────► utxo_created
utxo_created ─claim by relayer───► claimed
claimed ─withdraw to public──────► withdrawn
withdrawn ─jupiter swap OK───────► swapped
swapped ─output sent to dest─────► settled
   any────────error / timeout────► failed | expired
```

## Auth tiers

| Tier | Header | Pricing |
|------|--------|---------|
| `anonymous` | (none) | x402 (`X-PAYMENT` header, USDC on Solana mainnet via Coinbase facilitator) |
| `api_key`   | `Authorization: Bearer sk_solrouter_*` | Internal credit deduction OR x402 (lower price than anonymous) |
| `internal`  | `Authorization: Bearer <SOLROUTER_INTERNAL_JWT>` | Free — for our own agent products |

## Pricing (`/.well-known/x402`)

| Endpoint | x402 USDC | Notes |
|----------|-----------|-------|
| `GET /agents/v1/quote` | 0.001 | |
| `GET /agents/v1/anonymity-set` | free | |
| `POST /agents/v1/swaps/oneshot` | 0.10 + 5 bps spread | |
| `POST /agents/v1/wallets` | 0.05 | api_key / internal only |
| `POST /agents/v1/wallets/:id/swap` | 0.05 + 5 bps spread | |
| `POST /agents/v1/wallets/:id/fund-intent` | 0.001 | |
| `POST /agents/v1/wallets/:id/withdraw` | 0.05 | |
| `GET /agents/v1/wallets/:id/balance` | 0.005 | |
| `GET /agents/v1/wallets/:id/audit` | free | |
| `GET /agents/v1/sessions/:id` | free | |
| `GET /agents/v1/attestations/:sessionId` | free | |

5-bps spread is taken from the swap output before delivery; disclosed in the quote response.

## Security & privacy model

### What's hidden from the chain
- Amounts at the encrypted-balance layer.
- Transaction-graph link between deposit and claim (Umbra mixer + ZK).
- For Mode A: cumulative source unlinkability across many swaps.

### What Solrouter sees (be honest)
- Mode A: agent → wallet_id mapping; every sign event timestamp; swap intents.
- Mode B: payer → ephemeral → destination triple for ~60s, then dropped.
- Both: anonymity-set queries, billing.

### What Solrouter does NOT see
- Any agent tx that doesn't touch our API.
- The Umbra master seed and viewing keys are computed in process memory only and wiped after each request via `KeyHolder.wipe()`.

### Hardening
- Process-memory hygiene with explicit `wipe()` (Buffer.fill(0)).
- Envelope encryption (per-wallet DEK, KEK in Supabase Vault, KEK rotation supported).
- OFAC SDN screening on every destination; refuses with HTTP 451.
- Anonymity-set floor; off-bucket override gated behind `bypassBucket=true`.
- Rate limits (per API-key + per IP).
- HMAC-signed webhooks (`X-Solrouter-Signature: sha256=...`).
- Session retention 7 days; audit log 1 year.

### On-chain attestations
After settle, Solrouter publishes a privacy attestation PDA (reuses `routes/arcium.js`). Verifiable on Solscan via `GET /agents/v1/attestations/:sessionId`.

## Files

- HTTP routes: `routes/agents/`
- Orchestrator: `lib/umbra-server/`
- Worker: `lib/agentSwapWorker.js`
- Vault: `lib/walletVault.js`
- x402 middleware: `lib/x402Middleware.js`
- OpenAPI source: `lib/umbra-server/openapi.js`
- MCP stdio server: `packages/mcp-server/src/index.ts`
- npm SDK: `packages/agent-tools-sdk/`
- Discovery: `routes/wellKnown.js`, `routes/agents/discovery.js`
- Skill: `skills/agent-private-swap/SKILL.md`
- Migrations: `migrations/009_agent_swap_sessions.sql`, `010_managed_umbra_wallets.sql`, `011_x402_payment_log.sql`
