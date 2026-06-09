// Generates Fumadocs MDX pages (one per operation) for the Agent Privacy API
// from the committed OpenAPI snapshot. Run: node scripts/generate-openapi.mjs
import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

const openapi = createOpenAPI({ input: ['./openapi/agent-privacy.json'] });

await generateFiles({
  input: openapi,
  output: './content/docs/api-reference/agent-privacy',
  per: 'operation',
  // Group endpoints by their OpenAPI tag so the sidebar reads as
  // Swaps / Managed Wallets / Private Balance / Inference / Sessions
  // instead of one flat list of 15 routes.
  groupBy: 'tag',
});

console.log('Agent Privacy API reference pages generated.');
