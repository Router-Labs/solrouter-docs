import type { ReactNode } from 'react';


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
