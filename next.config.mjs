import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

// Old slug -> new slug. Each row also redirects its `.md` twin, which proxy.ts
// rewrites for text readers. Add a row whenever a page moves.
const moves = [];

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
