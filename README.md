# Solrouter Documentation

The first cryptographically private AI infrastructure layer. Not another wrapper — real cryptographic guarantees that your prompts and responses never leave encryption.

---

## Why Solrouter?

Every AI interaction you have today is logged, stored, and analyzed. Existing providers store your prompts indefinitely, require PII to sign up, and offer vague privacy policies with no technical enforcement.

We built infrastructure where **we can't see your data**. Not because of policy — because of math.

---

## What's Encrypted, and How

We get this question often, so to be precise:

**Today, in production:**
- **Client-side encryption:** Arcium's `RescueCipher` (a field-element symmetric cipher chosen for MPC / FHE / ZK compatibility) with `X25519` key exchange.
- **Inference isolation:** Intel **TDX** Confidential VM (a Trusted Execution Environment). Plaintext exists only inside attested enclave memory; no host process — including ours — can read it. The TEE's X25519 keypair is generated inside the CVM at boot; the private key never leaves the enclave.
- **Transport:** encrypted end-to-end between the client and the enclave; the Solrouter backend is a blind relay.
- **Verifiable attestation:** the enclave publishes an Intel-signed TDX quote that binds the public key to the exact code measurement. You can verify the running image yourself — see [Verifiable Attestation](#verifiable-attestation) below.

**What we are not (yet) doing:**
- We are **not running pure FHE inference**. No production system runs LLM-scale inference under fully homomorphic encryption today — the latency is many orders of magnitude away from viable. Anyone claiming "FHE LLM inference" in production in 2026 is overclaiming.

**Why "Arcium" still matters for the FHE story:**
- Arcium's MXE (Multiparty eXecution Environment) architecture is a hybrid stack of **MPC + FHE + ZK** primitives. We sit on that substrate, so FHE is in the foundation we build on.
- RescueCipher specifically exists as a field-element cipher so that the same encrypted payloads can be processed under MPC, FHE, or ZK as Arcium's network matures — no rewrite of our encryption layer.

**Roadmap:** as Arcium's MXE network ships in production, more of the inference pipeline moves from TEE-isolated plaintext into cryptographic compute (MPC first, with FHE/ZK primitives where they make sense). The client encryption layer stays unchanged.

**TL;DR** — Arcium-encrypted in transit + Intel-TDX-isolated during compute, with a real on-chain attestation program; cryptographic compute as the substrate matures. Calling this "FHE" today would be wrong; calling it "built on a stack that includes FHE primitives" is accurate.

```
You (Browser / SDK)
    │
    ├── Arcium RescueCipher encrypts prompt client-side
    │   with TEE's attested X25519 public key
    │
    ▼
Solrouter Backend
    │
    ├── Cannot decrypt. Routes encrypted blob blindly
    │
    ▼
Intel TDX Enclave
    │
    ├── Hardware-isolated decryption inside the enclave
    ├── Calls the model provider with plaintext (in-enclave only)
    ├── Encrypts response with the session's ephemeral key
    │
    ▼
Solrouter Backend
    │
    ├── Still can't see anything
    │
    ▼
You
    │
    └── Decrypt with your ephemeral private key
```

**Zero knowledge. End-to-end. Verifiable.**

---

## Verifiable Attestation

Every TEE response is backed by a real Intel-signed TDX quote. You don't have to trust us — you can verify the enclave yourself.

**Live endpoints:**
- `GET /tee/public-key` → the X25519 public key currently used for client-side encryption.
- `GET /tee/attestation` → the Intel TDX quote, with `report_data = sha256(pubkey)`. This binds the public key to the exact code measurement running inside the CVM.

**What you can check:**
- The TDX quote chains to Intel's root and indicates the host is a genuine TDX CPU.
- The event log includes verifiable measurements of the exact stack running (`compose-hash`, `app-id`, `os-image-hash`, `mr-kms`), so you can confirm the code that processed your prompt is the code we publish.

**On-chain anchor:**
The Solrouter encryption-attestation program is deployed on Solana **mainnet** at `ATMRatMtsKX4bHax7U4FRdhbE4mjU4NKpDZGqZqAhBKb`. Each privacy-mode session can publish a PDA that links the request to the attested TEE — settling on-chain that this specific interaction was processed inside a verified enclave.

---

## Products

### 1. Privacy SDK — `@solrouter/sdk`

Integrate private AI into your applications. The SDK handles encryption automatically — it fetches the TEE's attested public key, encrypts client-side with RescueCipher, sends the blob through Solrouter, and decrypts the response with your ephemeral session key.

```bash
npm install @solrouter/sdk
```

**Basic chat (encrypted by default):**

```typescript
import { SolRouter } from '@solrouter/sdk';

const client = new SolRouter({
  apiKey: 'sk_solrouter_...'
});

// Encrypted end-to-end. Solrouter backend never sees plaintext.
const response = await client.chat('What are the risks of this DeFi protocol?');
console.log(response.message);
```

**Choosing a model:**

```typescript
const response = await client.chat('Summarize the latest Solana validator outage', {
  model: 'claude-sonnet-4',         // gpt-oss-20b | gpt-4o-mini | gemini-flash | claude-sonnet | claude-sonnet-4
});
```

**Opt out of encryption (faster, plaintext path):**

```typescript
const response = await client.chat('Hello', { encrypted: false });
```

**SERV-guided reasoning** (tool-augmented agent path — see [Agent Framework](#agent-framework)):

```typescript
const response = await client.chat('Compare Marginfi vs Kamino lending on Solana', {
  reasoning: 'braid',  // routes through the agent endpoint with guided reasoning
});
```

**Check balance:**

```typescript
const { usdcBalance, routerBalance } = await client.balance();
```

**Why this matters:** no email, no credit card, no KYC. Connect a Solana wallet on [solrouter.com/sdk](https://solrouter.com/sdk), generate an API key, and start building. Pricing is metered per call in USDC (or `$ROUTER`) from your prepaid balance.

### 2. Agent Tools SDK — `@solrouter/agent-tools`

Typed tools for the **Solrouter Agent Privacy API** (`/agents/v1`). Drop-in adapters for OpenAI, Anthropic, and Vercel AI SDK function-calling — so your existing LLM agents can quote, execute, and settle privacy-preserving swaps + encrypted inference without writing the orchestration yourself.

```bash
npm install @solrouter/agent-tools
```

**Vercel AI SDK quickstart:**

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SolrouterAgentClient } from "@solrouter/agent-tools";
import { aiSdkTools } from "@solrouter/agent-tools/ai-sdk";

const solrouter = new SolrouterAgentClient({
  apiKey: process.env.SOLROUTER_API_KEY,
});

const result = await generateText({
  model: openai("gpt-4o"),
  tools: aiSdkTools(solrouter),
  prompt: "Privately swap 0.01 SOL to USDC and send the USDC to AAA...XXX",
});
```

**Anthropic quickstart:**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { anthropicTools, SolrouterAgentClient, callTool, type ToolName } from "@solrouter/agent-tools";

const anthropic = new Anthropic();
const solrouter = new SolrouterAgentClient({ apiKey: process.env.SOLROUTER_API_KEY });

const msg = await anthropic.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 1024,
  tools: anthropicTools,
  messages: [{ role: "user", content: "Quote a private 1 SOL → USDC swap" }],
});

for (const block of msg.content) {
  if (block.type === "tool_use") {
    const out = await callTool(solrouter, block.name as ToolName, block.input as Record<string, unknown>);
    // ...send tool_result back per Anthropic message loop
  }
}
```

**Direct (no LLM):**

```typescript
import { SolrouterAgentClient } from "@solrouter/agent-tools";

const client = new SolrouterAgentClient({ apiKey: "sk_solrouter_..." });

const session = await client.swapOneshot({
  payerPubkey: "...",
  fromMint: "So11111111111111111111111111111111111111112",   // SOL
  toMint:   "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",   // USDC
  amount: "10000000",
  destinationPubkey: "...",                                    // fresh address — no on-chain link to payer
});

// Agent signs session.fundingTx with their wallet, broadcasts, then:
await client.swapOneshotExecute(session.sessionId, fundingTxSig);
const settled = await client.pollUntilSettled(session.sessionId);
```

Authentication supports three tiers:
- **API key** — `Authorization: Bearer sk_solrouter_...`, billed from prepaid balance.
- **x402 (no key)** — per-call USDC settlement on Solana mainnet via Coinbase facilitator. Discovery at [`/.well-known/x402`](https://solrouter.com/.well-known/x402).
- **Internal JWT** — for our own first-party products.

### 3. MCP Server — `@solrouter/mcp-server`

Use Solrouter from Claude Desktop, Cursor, or any MCP client.

```json
{
  "mcpServers": {
    "solrouter": {
      "command": "npx",
      "args": ["@solrouter/mcp-server"],
      "env": {
        "SOLROUTER_API_KEY": "sk_solrouter_..."
      }
    }
  }
}
```

**Privacy + research tools:**

| Tool | Description |
|------|-------------|
| `private_research` | Encrypted multi-source research (web + DEX + on-chain + AI synthesis) |
| `encrypted_chat` | Direct E2E encrypted AI query |
| `private_token_analysis` | Comprehensive encrypted token research |
| `private_wallet_audit` | Encrypted wallet intelligence |
| `list_models` | Available models with pricing |
| `account_balance` | USDC + `$ROUTER` credit balance |

**Agent Privacy API tools** (added in the agent-API release):

| Tool | Description |
|------|-------------|
| `umbra_quote` | Quote a private swap with anonymity-set sizing |
| `umbra_anonymity_set` | Inspect current anonymity set for a mint pair |
| `umbra_swap_oneshot` | One-shot swap session — agent signs funding tx |
| `umbra_swap_oneshot_execute` | Submit signed funding tx to start execution |
| `umbra_session_status` | Poll session state until `settled` |
| `umbra_create_wallet` | Provision a managed Umbra wallet for an agent |
| `umbra_swap_managed` | Run a swap from a managed wallet |
| `umbra_encrypt` | Convert balance to encrypted balance on the same wallet |
| `umbra_shield` | Mixer round-trip → withdraw → forward to a fresh address |
| `umbra_balance` | Read encrypted balance of a managed wallet |
| `umbra_attestation` | Fetch the on-chain attestation PDA for a session |
| `private_inference_paid` | x402-paywalled encrypted inference (no API key) |

### 4. Chat App

Multi-model access in one interface with encrypted chat history, file attachments, image/video generation, and a RAG knowledge base. Live at [solrouter.com/chat](https://solrouter.com/chat).

---

## Agent Framework

Tool-augmented AI agents with SERV guided reasoning and skill-graph knowledge injection.

### SERV Reasoning

SERV (Structured Execution via Reasoning Virtualization) replaces freeform LLM decision-making with deterministic guided reasoning diagrams (GRDs). Instead of the LLM deciding what to do at each step, SERV walks a pre-defined execution graph — the LLM is only called for synthesis.

**Results vs standard agent loops:**

| Metric       | Standard       | SERV         | Improvement |
|--------------|----------------|--------------|-------------|
| Quality      | 80/100         | 93/100       | +13         |
| Token cost   | 19,917/query   | 4,047/query  | -79.7%      |
| Latency      | 24.0s          | 15.7s        | -35%        |
| Reliability  | 100%           | 100%         | Parity      |

Key insight: don't ask a 20B model to make structural decisions — do it deterministically. The LLM is used only where it adds value: synthesis of collected data into natural language.

### Skill Graphs

Structured domain-knowledge layer that sits between tool execution and LLM synthesis. When a query matches skill-node triggers, the engine traverses connected nodes and injects relevant domain knowledge into the synthesis context.

**14 base knowledge nodes** covering:
- DeFi protocol analysis, liquidity risk, tokenomics
- Market analysis, on-chain signals, whale tracking
- Wallet analysis, portfolio risk assessment
- Privacy / encryption technology (MPC, ZK, TEE)
- Research methodology, source evaluation, comparative analysis
- Solana ecosystem knowledge

Skill graphs are selective — they only activate for complex queries where domain knowledge improves output quality. Simple queries (price checks, swap quotes) skip skill-graph traversal entirely to maintain speed.

### Built-in Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web via Brave Search API for real-time information |
| `scrape_url` | Extract and clean content from any URL |
| `crawl_url` | Crawl entire websites via Cloudflare Browser Rendering (handles JS-heavy sites) |
| `solana_balance` | Check SOL and SPL token balances for any wallet |
| `token_price` | Real-time price, volume, liquidity, market cap via DexScreener + Jupiter |
| `swap_quote` | DEX swap quotes from Jupiter aggregator |
| `trending_tokens` | Trending / boosted tokens from DexScreener with price data |
| `deepwiki` | AI-powered GitHub repository research via DeepWiki |

### Agent API Example

```bash
curl -X POST "https://api.solrouter.com/agent" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Compare Marginfi vs Kamino lending on Solana",
    "model": "gpt-oss:20b",
    "useTools": true
  }'
```

```json
{
  "success": true,
  "reply": "## Marginfi vs Kamino Lending Comparison\n\n...",
  "toolCalls": [
    { "tool": "web_search", "args": { "query": "Marginfi vs Kamino lending Solana" } },
    { "tool": "token_price", "args": { "token": "MNDE" } }
  ],
  "iterations": 4,
  "skillGraph": {
    "nodesTraversed": ["defi-analysis", "liquidity-risk", "comparative-analysis"],
    "relevanceScore": 0.72
  }
}
```

### Agent Privacy API — `/agents/v1`

A separate, agent-first surface for privacy-preserving on-chain actions and encrypted inference. Two execution modes:

- **Mode A — managed wallet:** the agent gets a long-lived encrypted-balance wallet, funds it once, then runs many private swaps from it. Custody window minimized — the per-wallet DEK is envelope-encrypted with our KMS-held KEK, and never persisted in plaintext.
- **Mode B — one-shot swap:** the agent receives an unsigned funding tx, signs with its own wallet, submits, and the orchestrator runs the 7-step mixer + Jupiter + forward-to-destination pipeline.

**Discovery:**
- [`/.well-known/agent-card.json`](https://solrouter.com/.well-known/agent-card.json) — A2A protocol v1.0 card with the full skill list.
- [`/.well-known/x402`](https://solrouter.com/.well-known/x402) — x402 paywall manifest. Per-call USDC pricing for agents without an API key.
- [`/agents/v1/openapi.json`](https://solrouter.com/agents/v1/openapi.json) — full OpenAPI 3.1 spec.
- [`/agents/v1/capabilities`](https://solrouter.com/agents/v1/capabilities) — capability summary.

**Inference (pay.sh-compatible):**
`POST /api/v1/x402/chat/completions` — Arcium-encrypted prompt in, encrypted response out, x402 USDC paywalled at $0.005 / call. Drop-in for any x402-aware agent.

---

## Supported Models

- **Nosana:** Decentralized GPU inference — GPT-OSS 20B (default)
- **Qwen:** Qwen 3.6 Plus (1M context)
- **OpenAI:** GPT-5.4, GPT-4o, GPT-4o mini
- **Anthropic:** Claude 4.7 Opus, Claude 4.6 Sonnet, Claude 4.5 Sonnet, Claude 4.5 Haiku

All models are reachable through the same encrypted path — the TEE picks the upstream provider based on the model string, so the encryption guarantee is uniform.

---

## Links

- [Chat App](https://solrouter.com/chat)
- [SDK & API Keys](https://solrouter.com/sdk)
- [Agent](https://solrouter.com/agent)
- [Agent Privacy API capabilities](https://solrouter.com/agents/v1/capabilities)
- [TEE Attestation](https://solrouter.com/tee/attestation)
- [Twitter](https://twitter.com/SolRouterAI)

---

Built with privacy, powered by Solana & Arcium.
