# @solrouter/mcp-server

Private AI research for any MCP client. Every query is E2E encrypted via Arcium MPC — SolRouter's backend never sees your plaintext.

## Why SolRouter?

Other MCP tools give you raw data. SolRouter gives you **private intelligence** — encrypted multi-source research combining web data, DEX analytics, on-chain intelligence, and AI synthesis. Nobody sees what you're researching.

## Quick Start

```bash
npx @solrouter/mcp-server
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SOLROUTER_API_KEY` | Yes | Your API key (`sk_solrouter_...`) |
| `BRAVE_API_KEY` | No | Brave Search for web research |
| `HELIUS_RPC_URL` | No | Solana RPC for on-chain data |

### Claude Desktop

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

## Tools

### Research

| Tool | Description |
|------|-------------|
| `private_research` | **Flagship** — Encrypted multi-source research (web + DEX + on-chain + AI synthesis) |
| `encrypted_chat` | Direct encrypted AI query via Arcium MPC + TEE |
| `private_token_analysis` | Deep token research (DEX + web + price + AI analysis), all private |
| `private_wallet_audit` | Encrypted wallet intelligence and portfolio analysis |

### Utility

| Tool | Description |
|------|-------------|
| `list_models` | Available AI models with privacy levels and pricing |
| `account_balance` | Check your SolRouter USDC credit balance |

## How Privacy Works

1. Your query is encrypted client-side with **Arcium RescueCipher** (X25519 key exchange)
2. Encrypted payload sent to SolRouter's **Trusted Execution Environment (TEE)**
3. Decrypted only inside the TEE — SolRouter backend never sees plaintext
4. Response encrypted back to you with your session key
5. On-chain privacy attestation proves the process was tamper-free

## License

MIT
