import { Cpu, Database, Link2, Server, User, Zap, type LucideIcon } from 'lucide-react';

type Zone = {
  icon: LucideIcon;
  title: string;
  state: string;
  plaintext: boolean;
  attacker: string;
};

const ZONES: Zone[] = [
  {
    icon: User,
    title: 'Your device',
    state: 'Plaintext',
    plaintext: true,
    attacker: 'your prompt and the reply',
  },
  {
    icon: Link2,
    title: 'Network',
    state: 'Ciphertext',
    plaintext: false,
    attacker: 'ciphertext and traffic timing',
  },
  {
    icon: Server,
    title: 'Solrouter backend',
    state: 'Ciphertext',
    plaintext: false,
    attacker: 'ciphertext, your wallet or key, the model name',
  },
  {
    icon: Cpu,
    title: 'TDX enclave',
    state: 'Plaintext in CPU-encrypted memory',
    plaintext: true,
    attacker: 'encrypted memory, not the text',
  },
  {
    icon: Zap,
    title: 'Nosana GPU node',
    state: 'Plaintext in the Ollama process, TLS in transit',
    plaintext: true,
    attacker: 'your prompt and the reply, not who you are',
  },
  {
    icon: Database,
    title: 'Solana',
    state: 'Hash only',
    plaintext: false,
    attacker: 'a hash of the ciphertext and the model name',
  },
];

/**
 * Where the prompt exists as readable text on the encrypted path.
 * Plaintext zones use the primary tint; ciphertext and hash-only zones use
 * the muted tint. Each zone carries a one-line "an attacker here sees" label.
 */
export function PlaintextZones() {
  return (
    <figure
      role="img"
      aria-label="Six zones from your device to Solana. Your prompt is readable on your device, inside the TDX enclave, and on the Nosana GPU node. It is ciphertext on the network and at the Solrouter backend. Solana holds only a hash."
      className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-stretch md:gap-2">
        {ZONES.map((zone) => (
          <div key={zone.title} className="flex flex-1 flex-col gap-2">
            <div className="text-[11px] leading-snug text-fd-muted-foreground">
              <span className="font-medium text-fd-foreground">An attacker here sees:</span> {zone.attacker}
            </div>
            <div
              className={`flex flex-1 flex-col items-center gap-2 rounded-xl border border-fd-border p-3 text-center ${
                zone.plaintext ? 'bg-fd-primary/15' : 'bg-fd-muted'
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  zone.plaintext ? 'bg-fd-card text-fd-primary' : 'bg-fd-card text-fd-muted-foreground'
                }`}
              >
                <zone.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="text-sm font-medium text-fd-foreground">{zone.title}</div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-fd-muted-foreground">
                {zone.state}
              </div>
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-fd-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-fd-border bg-fd-primary/15" aria-hidden />
          Readable text exists here
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-fd-border bg-fd-muted" aria-hidden />
          Only ciphertext or a hash exists here
        </span>
      </figcaption>
    </figure>
  );
}
