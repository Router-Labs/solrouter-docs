// Docs checks that run in CI and locally: node scripts/check-docs.mjs
//
// 1. Prose: no em dash (U+2014), en dash (U+2013), spaced double hyphen, or banned words
//    in hand-written pages.
// 2. Status: every hand-written page declares `status:` and `checked:` in frontmatter.
// 3. Fallback: every diagram component is followed within 6 lines by an "In words"
//    Markdown list or a table, so text readers (llms.txt, .md routes) keep the meaning.
//
// Generated pages under content/docs/api-reference/agent-privacy/** are skipped.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../content/docs/', import.meta.url));
const SKIP = /api-reference\/agent-privacy\//;
const BANNED = [
  'delve', 'crucial', 'pivotal', 'robust', 'seamless', 'tapestry', 'testament',
  'underscore', 'showcase', 'foster', 'intricate', 'vibrant', 'enhance', 'garner',
  'interplay', 'align with', 'additionally',
];
// Components that draw a picture. Each use needs an "In words" list or a table right after it.
const DIAGRAM = /<(EncryptionFlow|TokenAllocation|ArchitectureMap|RequestFlowStepper|SkillGraphMap|[A-Z][A-Za-z]*Diagram)\b/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.mdx')) out.push(p);
  }
  return out;
}

const problems = [];
let checked = 0;

for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (SKIP.test(rel)) continue;
  checked += 1;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // Frontmatter block.
  const fm = text.startsWith('---') ? text.slice(3, text.indexOf('\n---', 3)) : '';
  if (!/^status:\s*(live|soon|archived|mixed)\s*$/m.test(fm)) problems.push(`${rel}: missing or invalid \`status:\` in frontmatter`);
  if (!/^checked:\s*"?\d{4}-\d{2}-\d{2}"?\s*$/m.test(fm)) problems.push(`${rel}: missing \`checked: YYYY-MM-DD\` in frontmatter`);

  let inCode = false;
  lines.forEach((line, i) => {
    const n = i + 1;
    if (line.trim().startsWith('```')) inCode = !inCode;
    if (inCode) return;
    if (/[—–]/.test(line)) problems.push(`${rel}:${n}: em or en dash`);
    if (/\s--\s/.test(line)) problems.push(`${rel}:${n}: spaced double hyphen`);
    const lower = line.toLowerCase();
    for (const w of BANNED) {
      if (new RegExp(`\\b${w}\\b`).test(lower)) problems.push(`${rel}:${n}: banned word "${w}"`);
    }
    if (DIAGRAM.test(line)) {
      const window = lines.slice(i + 1, i + 8).join('\n');
      const hasFallback = /^\s*([-*]\s|\d+\.\s|\|)/m.test(window);
      if (!hasFallback) problems.push(`${rel}:${n}: diagram without an "In words" list or table within 6 lines`);
    }
  });
}

if (problems.length) {
  console.error(`check-docs: ${problems.length} problem(s) in ${checked} page(s)\n` + problems.map((p) => `  ${p}`).join('\n'));
  process.exit(1);
}
console.log(`check-docs: ${checked} page(s) ok`);
