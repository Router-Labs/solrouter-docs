import type { ReactNode } from 'react';

/** Cell tokens. `pt` (readable) is the only one that means a party can read your words. */
export type Cell = 'pt' | 'ct' | 'no' | 'ha' | 're' | 'me' | 'nd';

const STYLE: Record<Cell, { label: string; cls: string }> = {
  pt: { label: 'readable', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/40' },
  ct: { label: 'encrypted', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40' },
  no: { label: 'nothing', cls: 'bg-fd-muted text-fd-muted-foreground border border-fd-border' },
  ha: { label: 'hash only', cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border border-sky-500/40' },
  re: { label: 'at rest*', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-200 border border-amber-500/30' },
  me: { label: 'metadata', cls: 'bg-fd-muted text-fd-muted-foreground border border-fd-border' },
  nd: { label: 'unknown', cls: 'text-fd-muted-foreground border border-dashed border-fd-border' },
};

const LEGEND: { token: Cell; text: string }[] = [
  { token: 'pt', text: 'readable: this party can read your words' },
  { token: 'ct', text: 'encrypted: sees only ciphertext, holds no key' },
  { token: 'no', text: 'nothing: never reaches this party' },
  { token: 'ha', text: 'hash only: a fingerprint, not your words' },
  { token: 're', text: 'at rest: stored encrypted under a key Solrouter holds' },
  { token: 'me', text: 'metadata: size or timing, not content' },
];

function Pill({ token }: { token: Cell }) {
  const s = STYLE[token];
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ${s.cls}`}>
      {s.label}
    </span>
  );
}

export type MatrixRow = { what: ReactNode; cells: Cell[] };

/**
 * Threat-model matrix. Each row is a kind of data; each column is a party;
 * each cell says what that party can see. Amber cells are the only exposure.
 */
export function PrivacyMatrix({
  parties,
  rows,
  legend = true,
}: {
  parties: string[];
  rows: MatrixRow[];
  legend?: boolean;
}) {
  return (
    <figure role="img" aria-label="A matrix of who can see what. Amber cells mark where a party can read your words." className="my-6">
      <div className="overflow-x-auto rounded-xl border border-fd-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-fd-muted/50">
              <th className="p-3 text-left font-semibold">What</th>
              {parties.map((p) => (
                <th key={p} className="p-3 text-left align-bottom text-xs font-semibold text-fd-muted-foreground">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-fd-border">
                <td className="p-3 font-medium">{row.what}</td>
                {row.cells.map((c, j) => (
                  <td key={j} className="p-3">
                    <Pill token={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legend ? (
        <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-fd-muted-foreground">
          {LEGEND.map((l) => (
            <span key={l.token} className="inline-flex items-center gap-1.5">
              <Pill token={l.token} />
              {l.text.split(':')[1].trim()}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
