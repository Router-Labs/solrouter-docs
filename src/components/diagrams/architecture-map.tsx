'use client';

import { systemMapEdges, systemMapNodes } from '@/components/flow/data/system-map';
import { FlowFigure } from '@/components/flow/flow-figure';

export function ArchitectureMap() {
  return (
    <FlowFigure
      ariaLabel="Solrouter system map: the chat app, the SDK, the MCP server, and REST or x402 clients send ciphertext to the Solrouter backend on Render, which relays it to an Intel TDX CVM on Phala dStack; the CVM decrypts and calls a Nosana GPU node over TLS; the backend commits a receipt to Solana mainnet, settles USDC through the Coinbase x402 facilitator, and orchestrates private swaps through Umbra and Jupiter."
      nodes={systemMapNodes}
      edges={systemMapEdges}
    />
  );
}
