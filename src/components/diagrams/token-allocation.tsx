// Accurate to the distribution table on the $ROUTER Token page (sums to 100%).
// Monochrome ramp — segments are the foreground color at decreasing opacity,
// so it adapts to both light and dark themes.
const ALLOC = [
  { label: 'Liquidity Pool', pct: 45, amount: '450M', o: 1 },
  { label: 'Treasury', pct: 24.5, amount: '245M', o: 0.8 },
  { label: 'Team', pct: 20, amount: '200M', o: 0.62 },
  { label: 'OpenServ (SERV drop)', pct: 5, amount: '50M', o: 0.45 },
  { label: 'Algorithmic Fundraising', pct: 5, amount: '50M', o: 0.3 },
  { label: 'Superteam Germany', pct: 0.5, amount: '5M', o: 0.18 },
];

/** Theme-adaptive, monochrome stacked-bar infographic of the $ROUTER supply allocation. */
export function TokenAllocation() {
  return (
    <div className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <span className="text-sm font-medium text-fd-foreground">
          $ROUTER distribution
        </span>
        <span className="text-xs tabular-nums text-fd-muted-foreground">
          1,000,000,000 total
        </span>
      </div>

      <div
        className="flex h-4 w-full overflow-hidden rounded-full bg-fd-muted"
        role="img"
        aria-label="ROUTER token allocation: Liquidity Pool 45%, Treasury 24.5%, Team 20%, OpenServ 5%, Algorithmic Fundraising 5%, Superteam Germany 0.5%"
      >
        {ALLOC.map((a) => (
          <div
            key={a.label}
            style={{
              width: `${a.pct}%`,
              backgroundColor: 'var(--color-fd-foreground)',
              opacity: a.o,
            }}
          />
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {ALLOC.map((a) => (
          <li key={a.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{
                backgroundColor: 'var(--color-fd-foreground)',
                opacity: a.o,
              }}
              aria-hidden
            />
            <span className="text-fd-foreground">{a.label}</span>
            <span className="ml-auto tabular-nums text-fd-muted-foreground">
              {a.pct}% · {a.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
