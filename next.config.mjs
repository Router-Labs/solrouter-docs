import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Old slug -> new slug. Each row also redirects its `.md` twin, which proxy.ts
// rewrites for text readers. Add a row whenever a page moves.
const moves = [
  // Use Solrouter
  ['/docs/chat-app', '/docs/use/chat-app'],
  ['/docs/what-is-private', '/docs/use/what-is-private'],
  ['/docs/verify-a-reply', '/docs/verify'],
  ['/docs/use/verify-a-reply', '/docs/verify'],
  ['/docs/payments/overview', '/docs/use/pricing'],
  // Build on Solrouter
  ['/docs/quickstart', '/docs/build/quickstart'],
  ['/docs/develop/privacy-sdk', '/docs/build/privacy-sdk'],
  ['/docs/develop/mcp-server', '/docs/build/mcp-server'],
  ['/docs/develop/private-swaps', '/docs/build/agent-privacy-api'],
  ['/docs/develop/agent-tools-sdk', '/docs/build/agent-tools-sdk'],
  ['/docs/develop/authentication', '/docs/build/api-key'],
  // How it works
  ['/docs/what-is-a-tee', '/docs/how-it-works/what-is-a-tee'],
  ['/docs/under-the-hood', '/docs/how-it-works'],
  ['/docs/under-the-hood/request-flow', '/docs/how-it-works/request-flow'],
  ['/docs/under-the-hood/agent-reasoning', '/docs/how-it-works/agent-reasoning'],
  ['/docs/concepts/how-it-works', '/docs/how-it-works'],
  ['/docs/concepts/encryption', '/docs/how-it-works/encryption'],
  ['/docs/concepts/attestation', '/docs/how-it-works/attestation'],
  ['/docs/concepts/encryption-proof', '/docs/how-it-works/proof'],
  ['/docs/concepts/supported-models', '/docs/how-it-works/models'],
  ['/docs/concepts/agent-framework', '/docs/how-it-works/agent-reasoning'],
  ['/docs/concepts/serv-reasoning', '/docs/how-it-works/agent-reasoning'],
  ['/docs/concepts/skill-graphs', '/docs/how-it-works/agent-reasoning'],
  // Reference
  ['/docs/payments/tokenomics', '/docs/token'],
  ['/docs/api-reference/authentication', '/docs/build/api-key'],
];

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return moves.flatMap(([from, to]) => [
      { source: from, destination: to, permanent: true },
      { source: `${from}.md`, destination: `${to}.md`, permanent: true },
    ]);
  },
};

export default withMDX(config);
