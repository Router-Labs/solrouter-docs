import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Server, User, Zap, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

function Stage({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone?: 'accent' | 'danger';
}) {
  const box =
    tone === 'accent'
      ? 'border-fd-primary/40 bg-fd-primary/10'
      : tone === 'danger'
        ? 'border-amber-500/40 bg-amber-500/10'
        : 'border-fd-border bg-fd-card';
  const icon =
    tone === 'accent'
      ? 'text-fd-primary'
      : tone === 'danger'
        ? 'text-amber-600 dark:text-amber-300'
        : 'text-fd-muted-foreground';
  return (
    <div className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 ${box}`}>
      <Icon className={`h-4 w-4 shrink-0 ${icon}`} aria-hidden />
      <span className="text-xs font-semibold leading-tight text-fd-foreground">{label}</span>
    </div>
  );
}

function Hop({ label, safe }: { label: string; safe: boolean }) {
  const color = safe ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400';
  return (
    <div className={`flex shrink-0 items-center justify-center gap-1 ${color}`}>
      <span className="text-[10px] font-semibold whitespace-nowrap uppercase tracking-wide">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 rotate-90 md:rotate-0" aria-hidden />
    </div>
  );
}

function Lane({ title, safe, children }: { title: string; safe: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 rounded-full ${safe ? 'bg-emerald-500' : 'bg-amber-500'}`}
          aria-hidden
        />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
          {title}
        </span>
      </div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-stretch">{children}</div>
    </div>
  );
}

/**
 * Before and after. Row 1: a typical AI API reads your prompt in plaintext.
 * Row 2: Solrouter relays ciphertext and only the enclave opens it. The
 * plaintext/ciphertext state lives on the connectors, not in the boxes.
 * Pure CSS flex so it fits any width and stacks vertically on mobile.
 */
export function TypicalVsSolrouter() {
  return (
    <figure
      role="img"
      aria-label="Two rows. In a typical AI API your prompt travels in plaintext to the provider server, which reads it, then to the model. With Solrouter and encryption on, your device sends ciphertext, the Solrouter backend relays it without reading it, the TDX enclave opens it, and the Nosana GPU node runs the model over TLS."
      className="my-6 flex flex-col gap-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5"
    >
      <Lane title="Typical AI API" safe={false}>
        <Stage icon={User} label="You" />
        <Hop label="plaintext" safe={false} />
        <Stage icon={Eye} label="Provider server" tone="danger" />
        <Hop label="plaintext" safe={false} />
        <Stage icon={Server} label="Model" />
      </Lane>
      <Lane title="Solrouter, encryption on" safe>
        <Stage icon={Lock} label="You" tone="accent" />
        <Hop label="ciphertext" safe />
        <Stage icon={EyeOff} label="Solrouter backend" />
        <Hop label="ciphertext" safe />
        <Stage icon={KeyRound} label="TDX enclave" tone="accent" />
        <Hop label="plaintext / TLS" safe={false} />
        <Stage icon={Zap} label="Nosana GPU" />
      </Lane>
      <figcaption className="text-center text-xs text-fd-muted-foreground">
        The reply returns encrypted from the enclave. The backend never sees the text.
      </figcaption>
    </figure>
  );
}
