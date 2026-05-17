# Quickstart — Solrouter Agent Privacy API

Five minutes to your first private swap. Pick a surface.

## 1. Anthropic SDK

```ts
import Anthropic from "@anthropic-ai/sdk";
import { anthropicTools, callTool, SolrouterAgentClient, type ToolName } from "@solrouter/agent-tools";

const anthropic = new Anthropic();
const solrouter = new SolrouterAgentClient({ apiKey: process.env.SOLROUTER_API_KEY });

let messages = [{ role: "user", content: "Privately swap 0.01 SOL → USDC, send USDC to AAA…" }];
while (true) {
  const r = await anthropic.messages.create({
    model: "claude-opus-4-7", max_tokens: 1024, tools: anthropicTools, messages,
  });
  messages.push({ role: "assistant", content: r.content });
  const toolUses = r.content.filter((b) => b.type === "tool_use");
  if (toolUses.length === 0) break;
  for (const u of toolUses) {
    const out = await callTool(solrouter, u.name as ToolName, u.input as Record<string, unknown>);
    messages.push({ role: "user", content: [{ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(out) }] });
  }
}
```

## 2. Vercel AI SDK

```ts
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { SolrouterAgentClient } from "@solrouter/agent-tools";
import { aiSdkTools } from "@solrouter/agent-tools/ai-sdk";

const client = new SolrouterAgentClient({ apiKey: process.env.SOLROUTER_API_KEY });
const result = await generateText({
  model: openai("gpt-4o"),
  tools: aiSdkTools(client),
  prompt: "Private swap 0.01 SOL to USDC, deposit to AAA…",
});
console.log(result.text);
```

## 3. Plain HTTP (no SDK, no LLM)

```bash
SOLROUTER=https://solrouter-obb4.onrender.com
KEY="sk_solrouter_..."

# Quote
curl "$SOLROUTER/agents/v1/quote?fromMint=So11111111111111111111111111111111111111112&toMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=10000000" \
  -H "Authorization: Bearer $KEY"

# Mode B: kick off oneshot
SESSION=$(curl -s -X POST "$SOLROUTER/agents/v1/swaps/oneshot" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"payerPubkey":"YourWallet…","fromMint":"So11…","toMint":"EPj…","amount":"10000000","destinationPubkey":"DestAddr…"}')
echo "$SESSION" | jq .

# Sign + broadcast SESSION.fundingTx with your wallet (web3.js / sol-cli / Phantom)
# Then submit the resulting tx sig:
curl -X POST "$SOLROUTER/agents/v1/swaps/oneshot/$ID/execute" \
  -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d "{\"fundingTxSig\":\"$SIG\"}"

# Poll
curl "$SOLROUTER/agents/v1/sessions/$ID" -H "Authorization: Bearer $KEY"
```

## 4. MCP (Cursor / Claude Desktop / Cline)

Add to your MCP config:

```json
{
  "mcpServers": {
    "solrouter-privacy": {
      "command": "npx",
      "args": ["@solrouter/mcp-server"],
      "env": { "SOLROUTER_API_KEY": "sk_solrouter_..." }
    }
  }
}
```

Then in chat: "Quote a private 1 SOL → USDC swap." The agent will call `umbra_quote` automatically.

## 5. Mode A — Managed wallet

```ts
import { SolrouterAgentClient } from "@solrouter/agent-tools";
const client = new SolrouterAgentClient({ apiKey: "sk_solrouter_..." });

// Provision once
const wallet = await client.createWallet();
console.log("Fund this Umbra address:", wallet.umbraAddress);

// (Send some SOL/USDC to wallet.umbraAddress with your existing wallet)

// Then swap as many times as you want
const session = await client.swapManaged(wallet.walletId, {
  fromMint: "So11111111111111111111111111111111111111112",
  toMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  amount: "10000000",
  destinationPubkey: "FreshAddr…",
});
const settled = await client.pollUntilSettled(session.sessionId);
console.log("Settled:", settled);
```

## 6. Discovery

```bash
# A2A agent card (for A2A-aware clients)
curl https://solrouter-obb4.onrender.com/.well-known/agent-card.json | jq

# x402 paywall manifest
curl https://solrouter-obb4.onrender.com/.well-known/x402 | jq

# OpenAPI 3.1 spec
curl https://solrouter-obb4.onrender.com/agents/v1/openapi.json | jq

# Capabilities (custody modes, payment rails, discovery URLs)
curl https://solrouter-obb4.onrender.com/agents/v1/capabilities | jq
```
