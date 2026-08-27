/*
 * Architecture map data (design section 6, row 25).
 * Sources are monorepo file:line from the design doc dated 2026-08-26.
 * be: = SolRouter/dev/backend, fe: = SolRouter frontend.
 */
import { boxNode, flowEdge, type BoxNode, type FlowEdge } from './types';

const PROGRAM_ID = 'ATMRatMtsKX4bHax7U4FRdhbE4mjU4NKpDZGqZqAhBKb';

export const systemMapNodes: BoxNode[] = [
  boxNode('chat', 0, 0, {
    icon: 'MessageSquare',
    title: 'Chat app',
    sub: 'Encrypts in the browser',
    accent: true,
    detail: {
      holds: 'Your ephemeral X25519 key and the plaintext prompt, in the browser tab.',
      sees: 'Plaintext prompt and reply. Maximum Privacy Mode (toggle on) encrypts the text prompt for /tee/process. Persistent Privacy Mode (the default) sends the prompt in plaintext to the backend /nosana or /router route. Attachments are not encrypted client-side.',
      status: 'Live',
      source: 'fe:src/components/chat/ChatArea.tsx:542-569,1114; fe:src/lib/r2Upload.ts:36-47',
      href: '/docs/use/chat-app',
    },
  }),
  boxNode('sdk', 0, 110, {
    icon: 'Code',
    title: '@solrouter/sdk',
    sub: 'Encrypts before send',
    accent: true,
    detail: {
      holds: 'One session X25519 keypair per SDK instance and the cached enclave public key.',
      sees: 'Plaintext prompt and reply on your machine only.',
      status: 'Live',
      source: 'be:packages/sdk/src/encryption.ts:52-68,73-95; be:packages/sdk/src/client.ts:177-184',
      href: '/docs/build/privacy-sdk',
    },
  }),
  boxNode('mcp', 0, 220, {
    icon: 'Plug',
    title: '@solrouter/mcp-server',
    sub: 'Your machine, 22 tools',
    accent: true,
    detail: {
      holds: 'SOLROUTER_API_KEY, SOLROUTER_API_URL, and BRAVE_API_KEY on your machine; HELIUS_RPC_URL optional. Four tools use the encrypted /tee/process path for the model step: encrypted_chat, and the synthesis step of private_research, private_token_analysis, and private_wallet_audit.',
      sees: 'Plaintext locally. The data-gathering steps call Brave, DexScreener, CoinGecko, and the Helius or public Solana RPC directly, in plaintext, from your machine.',
      status: 'Live',
      source: 'be:packages/mcp-server/src/index.ts:28,60,71,114,122',
      href: '/docs/build/mcp-server',
    },
  }),
  boxNode('rest', 0, 330, {
    icon: 'Globe',
    title: 'REST and x402 clients',
    sub: 'API key or wallet, you encrypt',
    detail: {
      holds: 'An API key, or a wallet key for x402. x402 removes the API key, not the wallet key.',
      sees: 'Plaintext on your side. POST /api/v1/chat/completions requires encryptedPrompt and model.',
      status: 'Live',
      source: 'be:routes/private-ai-api.js:75-98; be:routes/private-ai-x402.js:74-79',
      href: '/docs/api-reference/overview',
    },
  }),
  boxNode('backend', 330, 165, {
    icon: 'Server',
    title: 'Solrouter backend',
    sub: 'Blind relay, keys, billing',
    detail: {
      holds: 'API keys, balances, the x402 paywall, and the deployer wallet that commits receipts. No decryption key.',
      sees: 'Ciphertext, your API key or wallet address, model name, and usage. Never the plaintext.',
      status: 'Live',
      source: 'be:routes/tee.js:33-54,57-73,84-103; be:lib/x402Middleware.js:27-46',
      href: '/docs/how-it-works/request-flow',
    },
  }),
  boxNode('cvm', 660, 40, {
    icon: 'ShieldCheck',
    title: 'Intel TDX CVM',
    sub: 'Phala dStack, tee-service',
    accent: true,
    detail: {
      holds: 'X25519 sealing key and ed25519 signing key, generated at boot, never exported. RescueCipher, tappd quote, 5-tool allowlist, SearXNG in the same CVM.',
      sees: 'Plaintext inside CPU-encrypted memory, for the length of one request.',
      status: 'Live',
      source: 'be:tee-service/src/index.js:76-101,107-119,217-238,321-329; be:tee-service/src/tools.js:28-34',
      href: '/docs/how-it-works/attestation',
    },
  }),
  boxNode('nosana', 990, 40, {
    icon: 'Zap',
    title: 'Nosana GPU node',
    sub: 'One job per model, Ollama',
    detail: {
      holds: 'The model weights and the Ollama process.',
      sees: 'Plaintext prompt and reply in the Ollama process, over TLS from the CVM. Not linked to your identity.',
      status: 'Live',
      source: 'be:tee-service/src/index.js:456-474; be:lib/nosanaEndpoints.js:14-32',
      href: '/docs/how-it-works/models',
    },
  }),
  boxNode('solana', 660, 290, {
    icon: 'Landmark',
    title: 'Solana',
    sub: 'Light compressed receipts',
    detail: {
      holds: `One Light Protocol compressed receipt per inference, under program ${PROGRAM_ID}, read through a Photon indexer.`,
      sees: 'The sha256 of your ciphertext, plus the model, provider, and enclave signature. No plaintext.',
      status: 'Live',
      source: 'be:services/lightAttestation.js:81-82,359-363; be:routes/verifyAttestation.js:7-10',
      href: '/docs/how-it-works/proof',
    },
  }),
  boxNode('umbra', 990, 290, {
    icon: 'Shuffle',
    title: 'Umbra mixer plus Jupiter',
    sub: 'Private swaps',
    status: 'Soon',
    detail: {
      holds: 'Mixer pool deposits and the Jupiter swap route.',
      sees: 'That you used Umbra is public. Deposit and claim amounts at the pool boundary are public.',
      status: 'Soon',
      source: 'be:UMBRA_PRIVATE_SWAP_ARCHITECTURE.md:5,17,47-70; be:lib/agentSwapWorker.js:4-7,25',
      href: '/docs/build/agent-privacy-api',
    },
  }),
  boxNode('facilitator', 330, 400, {
    icon: 'Coins',
    title: 'Coinbase x402 facilitator',
    sub: 'From the live manifest',
    detail: {
      holds: 'Nothing of yours. Verifies and settles the USDC payment that Solrouter\'s server sends it. The agent never talks to the facilitator.',
      sees: 'The signed payment payload and your wallet address.',
      status: 'Live',
      source: 'be:routes/wellKnown.js:73; be:lib/x402Middleware.js:29,52-63',
      href: '/docs/build/api-key',
    },
  }),
];

export const systemMapEdges: FlowEdge[] = [
  flowEdge('chat', 'backend', 'ciphertext (Maximum Privacy Mode) or plaintext (default)'),
  flowEdge('sdk', 'backend', 'ciphertext'),
  flowEdge('mcp', 'backend', 'ciphertext'),
  flowEdge('rest', 'backend', 'ciphertext'),
  flowEdge('backend', 'cvm', 'ciphertext'),
  flowEdge('cvm', 'nosana', 'plaintext over TLS'),
  flowEdge('backend', 'solana', 'receipt commit'),
  flowEdge('backend', 'facilitator', 'USDC'),
  flowEdge('backend', 'umbra'),
];
