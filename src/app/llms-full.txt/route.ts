import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

type Page = ReturnType<typeof source.getPages>[number];

// Order for text readers: Introduction first, then the other hand-written pages,
// then the generated Agent Privacy API endpoint pages last.
function rank(page: Page): number {
  if (page.slugs.length === 0) return 0;
  if (page.slugs[0] === 'api-reference' && page.slugs[1] === 'agent-privacy') return 2;
  return 1;
}

export async function GET() {
  const ordered = [...source.getPages()].sort((a, b) => rank(a) - rank(b));
  const scanned = await Promise.all(ordered.map(getLLMText));

  return new Response(scanned.join('\n\n'));
}
