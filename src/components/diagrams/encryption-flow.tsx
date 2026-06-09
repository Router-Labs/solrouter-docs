import { Cpu, Lock, Server, User, type LucideIcon } from 'lucide-react';

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
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium text-fd-foreground">{title}</div>
      <div className="text-xs leading-snug text-fd-muted-foreground">{sub}</div>
    </div>
  );
}

function Hop({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-1 px-1 py-1 text-fd-primary md:flex-col">
      <Lock className="h-4 w-4" aria-hidden />
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

/** Clean, theme-adaptive infographic of the encrypt → blind-relay → TEE flow. */
export function EncryptionFlow() {
  return (
    <div className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <Stage
          icon={User}
          title="Your device"
          sub="Encrypts the prompt — RescueCipher + X25519"
          accent
        />
        <Hop label="ciphertext" />
        <Stage
          icon={Server}
          title="Solrouter backend"
          sub="Blind relay — forwards, never decrypts"
        />
        <Hop label="ciphertext" />
        <Stage
          icon={Cpu}
          title="TEE enclave"
          sub="Decrypts and runs the model in isolation"
          accent
        />
      </div>
      <p className="mt-4 text-center text-xs text-fd-muted-foreground">
        The response is re-encrypted inside the enclave — only your device can
        read it.
      </p>
    </div>
  );
}
