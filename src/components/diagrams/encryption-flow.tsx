import { Cpu, Lock, Server, User, Zap, type LucideIcon } from 'lucide-react';

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
    <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-fd-border bg-fd-card p-4 text-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          accent
            ? 'bg-fd-primary/15 text-fd-primary'
            : 'bg-fd-muted text-fd-muted-foreground'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="text-sm font-medium text-fd-foreground">{title}</div>
      <div className="text-xs leading-snug text-fd-muted-foreground">{sub}</div>
    </div>
  );
}

function Hop({ label, open = false }: { label: string; open?: boolean }) {
  return (
    <div
      className={`flex shrink-0 flex-row items-center justify-center gap-1 px-1 py-1 md:flex-col ${
        open ? 'text-fd-muted-foreground' : 'text-fd-primary'
      }`}
    >
      <Lock className="h-4 w-4" aria-hidden />
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/**
 * Theme-adaptive infographic of the request path.
 *
 * encrypted (default): device encrypts, backend relays ciphertext, the CVM
 * decrypts and calls the model on a Nosana GPU node, the reply comes back
 * encrypted.
 *
 * encrypted={false}: the same path with plaintext at the backend. Used on the
 * Privacy SDK page to show what `encrypted: false` gives up.
 */
export function EncryptionFlow({ encrypted = true }: { encrypted?: boolean }) {
  const wire = encrypted ? 'ciphertext' : 'plaintext';
  const label = encrypted
    ? 'Request path with encryption on: your device encrypts the prompt, the Solrouter backend relays ciphertext it cannot read, the Intel TDX enclave decrypts it and calls the model on a Nosana GPU node, and the reply returns encrypted to your device.'
    : 'Request path with encryption off: your device sends plaintext, the Solrouter backend reads and routes it to the same self-hosted model on a Nosana GPU node, and the reply returns in plaintext.';

  return (
    <figure
      role="img"
      aria-label={label}
      className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5"
    >
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <Stage
          icon={User}
          title="Your device"
          sub={encrypted ? 'Encrypts the prompt: RescueCipher + X25519' : 'Sends the prompt as plaintext'}
          accent={encrypted}
        />
        <Hop label={wire} open={!encrypted} />
        <Stage
          icon={Server}
          title="Solrouter backend"
          sub={encrypted ? 'Blind relay: forwards, cannot decrypt' : 'Reads the prompt and routes it'}
        />
        <Hop label={wire} open={!encrypted} />
        <Stage
          icon={Cpu}
          title={encrypted ? 'TEE enclave' : 'TEE enclave (bypassed)'}
          sub={encrypted ? 'Decrypts inside Intel TDX, in isolation' : 'Not used on this path'}
          accent={encrypted}
        />
        <Hop label="plaintext over TLS" open />
        <Stage
          icon={Zap}
          title="Nosana GPU node"
          sub="Runs the open-weight model (Ollama)"
        />
      </div>
      <figcaption className="mt-4 text-center text-xs text-fd-muted-foreground">
        {encrypted
          ? 'The reply is encrypted inside the enclave with your session key. Only your device can read it.'
          : 'The reply returns in plaintext. No enclave, no on-chain receipt.'}
      </figcaption>
    </figure>
  );
}
