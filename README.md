# SolRouter Documentation

The first cryptographically private AI infrastructure layer. Not another wrapper — real cryptographic guarantees that your prompts and responses never leave encryption.

---

## Why SolRouter?

Every AI interaction you have today is logged, stored, and analyzed. Existing providers store your prompts indefinitely, require PII to sign up, and offer vague privacy policies with no technical enforcement.

We built infrastructure where **we can't see your data**. Not because of policy — because of math.

---

## What's Encrypted, and How

We get this question often, so to be precise:

**Today, in production:**
- **Client-side encryption:** Arcium's `RescueCipher` (a field-element symmetric cipher chosen for MPC / FHE / ZK compatibility) with `X25519` key exchange.
- **Inference isolation:** AWS Nitro Enclave (a Trusted Execution Environment). Plaintext exists only inside attested enclave memory; no host process — including ours — can read it.
- **Transport:** encrypted end-to-end between the client and the enclave; the SolRouter backend is a blind relay.

**What we are not (yet) doing:**
- We are **not running pure FHE inference**. No production system runs LLM-scale inference under fully homomorphic encryption today — the latency is many orders of magnitude away from viable. Anyone claiming "FHE LLM inference" in production in 2026 is overclaiming.

**Why "Arcium" still matters for the FHE story:**
- Arcium's MXE (Multiparty eXecution Environment) architecture is a hybrid stack of **MPC + FHE + ZK** primitives. We sit on that substrate, so FHE is in the foundation we build on.
- RescueCipher specifically exists as a field-element cipher so that the same encrypted payloads can be processed under MPC, FHE, or ZK as Arcium's network matures — no rewrite of our encryption layer.

**Roadmap:** as Arcium's MXE network ships in production, more of the inference pipeline moves from TEE-isolated plaintext into cryptographic compute (MPC first, with FHE/ZK primitives where they make sense). The client encryption layer stays unchanged.

**TL;DR** — Arcium-encrypted in transit + TEE-isolated during compute today; cryptographic compute as the substrate matures. Calling this "FHE" today would be wrong; calling it "built on a stack that includes FHE primitives" is accurate.

```
You (Browser)
    │
    ├── Arcium RescueCipher encrypts prompt client-side
    │
    ▼
SolRouter Backend
    │
    ├── Cannot decrypt. Routes encrypted blob blindly
    │
    ▼
AWS Nitro TEE
    │
    ├── Hardware-isolated decryption
    ├── Sends plaintext to AI provider
    ├── Encrypts response with ephemeral key
    │
    ▼
SolRouter Backend
    │
    ├── Still can't see anything
    │
    ▼
You (Browser)
    │
    └── Decrypt with your ephemeral private key
```

**Zero knowledge. End-to-end. Verifiable.**

---

## Products

### Privacy SDK (`@solrouter/sdk@1.0.1`)

Integrate private AI into your applications. The SDK handles encryption automatically.

```bash
npm install @solrouter/sdk@latest
```

```typescript
import { SolRouter } from '@solrouter/sdk';

const client = new SolRouter({
  apiKey: 'sk_solrouter_...'
});

// Encrypted by default — backend never sees your prompt
const response = await client.chat('What are the risks of this DeFi protocol?');
console.log(response.message);
```

**Features:**
- Arcium RescueCipher encryption (X25519 key exchange)
- Multi-model support (Nosana, Claude, Gemini, GPT)
- Encrypted + plaintext modes
- Balance and usage tracking

No email. No credit card. No KYC. Connect wallet, get API key, start building.

### MCP Server (`@solrouter/mcp-server`)

Use SolRouter from Claude Desktop, OpenClaw, Cursor, or any MCP client.

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

**Tools:**

| Tool | Description |
|------|-------------|
| `private_research` | Encrypted multi-source research (web + DEX + on-chain + AI synthesis) |
| `encrypted_chat` | Direct E2E encrypted AI query |
| `private_token_analysis` | Comprehensive encrypted token research |
| `private_wallet_audit` | Encrypted wallet intelligence |
| `list_models` | Available models with pricing |
| `account_balance` | USDC credit balance |

---

## Agent Framework

Tool-augmented AI agents with SERV guided reasoning and skill graph knowledge injection.

### SERV Reasoning

SERV (Structured Execution via Reasoning Virtualization) replaces freeform LLM decision-making with deterministic guided reasoning diagrams (GRDs). Instead of the LLM deciding what to do at each step, SERV walks a pre-defined execution graph — the LLM is only called for synthesis.

**Results vs standard agent loops:**

| Metric | Standard | SERV | Improvement |
|--------|----------|------|-------------|
| Quality | 80/100 | 93/100 | +13 |
| Token cost | 19,917/query | 4,047/query | -79.7% |
| Latency | 24.0s | 15.7s | -35% |
| Reliability | 100% | 100% | Parity |

Key insight: don't ask a 20B model to make structural decisions — do it deterministically. The LLM is used only where it adds value: synthesis of collected data into natural language.

### Skill Graphs

Structured domain knowledge layer that sits between tool execution and LLM synthesis. When a query matches skill node triggers, the engine traverses connected nodes and injects relevant domain knowledge into the synthesis context.

**14 base knowledge nodes** covering:
- DeFi protocol analysis, liquidity risk, tokenomics
- Market analysis, on-chain signals, whale tracking
- Wallet analysis, portfolio risk assessment
- Privacy/encryption technology (MPC, ZK, TEE)
- Research methodology, source evaluation, comparative analysis
- Solana ecosystem knowledge

Skill graphs are selective — they only activate for complex queries where domain knowledge improves output quality. Simple queries (price checks, swap quotes) skip skill graph traversal entirely to maintain speed.

### Built-in Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web via Brave Search API for real-time information |
| `scrape_url` | Extract and clean content from any URL |
| `crawl_url` | Crawl entire websites via Cloudflare Browser Rendering (handles JS-heavy sites) |
| `solana_balance` | Check SOL and SPL token balances for any wallet |
| `token_price` | Real-time price, volume, liquidity, market cap via DexScreener + Jupiter |
| `swap_quote` | DEX swap quotes from Jupiter aggregator |
| `trending_tokens` | Trending/boosted tokens from DexScreener with price data |
| `deepwiki` | AI-powered GitHub repository research via DeepWiki |

### API Example

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

### Chat App

Multi-model access in one interface with encrypted chat history, file attachments, image/video generation, and RAG knowledge base.

---

## Supported Models

- **Nosana**: Decentralized GPU inference (gpt-oss:20b)
- **OpenAI**: GPT-5, GPT-4o, GPT-4o Mini
- **Anthropic**: Claude 4.5 Sonnet, Claude 3.5 Haiku

---

## Links

- [Chat App](https://solrouter.com/chat)
- [SDK & API Keys](https://solrouter.com/sdk)
- [Agent](https://solrouter.com/agent)
- [Twitter](https://twitter.com/SolRouterAI)

---

Built with privacy, powered by Solana & Arcium.
