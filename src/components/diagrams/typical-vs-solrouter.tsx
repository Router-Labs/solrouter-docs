import { Eye, EyeOff, KeyRound, Lock, Server, User, Zap, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

function Stage({
  icon: Icon,
  title,
  sub,
  accent = false,
}: {
  icon: LucideIcon;
  title: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-fd-border bg-fd-card p-3 text-center">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          accent ? 'bg-fd-primary/15 text-fd-primary' : 'bg-fd-muted text-fd-muted-foreground'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="text-sm font-medium text-fd-foreground">{title}</div>
      <div className="text-xs leading-snug text-fd-muted-foreground">{sub}</div>
    </div>
  );
}

function Wire({ label, open = false }: { label: string; open?: boolean }) {
  const Icon = open ? Eye : Lock;
  return (
    <div
      className={`flex shrink-0 flex-row items-center justify-center gap-1 px-1 py-1 md:flex-col ${
        open ? 'text-fd-muted-foreground' : 'text-fd-primary'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}

function Row({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">{title}</div>
      <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">{children}</div>
    </div>
  );
}

/**
 * Before and after picture. Row 1: a typical AI API, where the provider's
 * server reads the prompt. Row 2: Solrouter with encryption on, where the
 * backend relays ciphertext and only the TDX enclave opens it.
 */
export function TypicalVsSolrouter() {
  return (
    <figure
      role="img"
      aria-label="Two rows. In a typical AI API your prompt travels in plaintext to the provider server, which can read, store, and train on it, then to the model. With Solrouter and encryption on, your device encrypts the prompt, the Solrouter backend sees only ciphertext and your wallet, the TDX enclave opens it, the Nosana GPU node runs the model, and the reply comes back encrypted to you."
      className="my-6 flex flex-col gap-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5"
    >
      <Row title="Typical AI API">
        <Stage icon={User} title="You" sub="Type the prompt" />
        <Wire label="plaintext" open />
        <Stage icon={Eye} title="Provider server" sub="Reads, stores, trains" />
        <Wire label="plaintext" open />
        <Stage icon={Server} title="Model" sub="Answers" />
      </Row>
      <Row title="Solrouter, encryption on">
        <Stage icon={Lock} title="You" sub="Encrypted here" accent />
        <Wire label="ciphertext" />
        <Stage icon={EyeOff} title="Solrouter backend" sub="Sees ciphertext and your wallet" />
        <Wire label="ciphertext" />
        <Stage icon={KeyRound} title="TDX enclave" sub="Opens it here" accent />
        <Wire label="plaintext over TLS" open />
        <Stage icon={Zap} title="Nosana GPU node" sub="Runs the model" />
        <Wire label="ciphertext" />
        <Stage icon={User} title="Back to you" sub="Only your device can read the reply" accent />
      </Row>
      <figcaption className="text-center text-xs text-fd-muted-foreground">
        The reply is encrypted inside the enclave before it travels back. The backend never sees the text.
      </figcaption>
    </figure>
  );
}
