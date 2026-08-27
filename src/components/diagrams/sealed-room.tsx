import {
  Building2,
  Cpu,
  DoorClosed,
  EyeOff,
  Lock,
  ShieldCheck,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';

function Feature({ icon: Icon, title, sub }: { icon: LucideIcon; title: string; sub: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-fd-border bg-fd-card p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-fd-primary/15 text-fd-primary">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div>
        <div className="text-sm font-medium text-fd-foreground">{title}</div>
        <div className="text-xs leading-snug text-fd-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

/**
 * The sealed-room picture of a Confidential VM (Intel TDX on Phala dStack).
 * Two layers: isolation (the operator cannot open the door) and attestation
 * (the window shows which program runs inside). The Nosana GPU node sits
 * outside the room and sees the prompt while it runs the model.
 */
export function SealedRoom() {
  return (
    <figure
      role="img"
      aria-label="A data center holds a glass room called Confidential VM with a locked slot for the public key and a window that shows attestation. The operator outside cannot open the door because the CPU encrypts the memory. A Nosana GPU node outside the data center runs the model and sees the prompt while it works."
      className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5"
    >
      <div className="rounded-xl border border-dashed border-fd-border p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fd-muted-foreground">
          <Building2 className="h-4 w-4" aria-hidden />
          Data center (cloud host)
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-fd-border bg-fd-muted p-4 text-center md:w-44">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-fd-card text-fd-muted-foreground">
              <User className="h-6 w-6" aria-hidden />
              <EyeOff className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-fd-card p-0.5 text-fd-foreground" aria-hidden />
            </div>
            <div className="text-sm font-medium text-fd-foreground">Operator</div>
            <div className="text-xs leading-snug text-fd-muted-foreground">
              Cannot open the door: memory is encrypted by the CPU
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 rounded-xl border-2 border-fd-primary/40 bg-fd-primary/15 p-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-fd-primary" aria-hidden />
              <span className="text-sm font-medium text-fd-foreground">Confidential VM (the sealed room)</span>
              <DoorClosed className="ml-auto h-5 w-5 text-fd-muted-foreground" aria-hidden />
            </div>
            <Feature
              icon={Lock}
              title="Locked slot: public key"
              sub="Anyone can drop a sealed message in. Only the room holds the key that opens it."
            />
            <Feature
              icon={ShieldCheck}
              title="Window: attestation"
              sub="A signed note that says: this exact program is running in here."
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-fd-border bg-fd-card p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-fd-muted text-fd-muted-foreground">
          <Zap className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <div className="text-sm font-medium text-fd-foreground">Nosana GPU node (outside the room)</div>
          <div className="text-xs leading-snug text-fd-muted-foreground">
            Runs the model. Sees the prompt while it works. Does not know who you are.
          </div>
        </div>
      </div>
      <figcaption className="mt-4 grid gap-2 text-xs text-fd-muted-foreground md:grid-cols-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm bg-fd-primary/40" aria-hidden />
          <span><span className="font-medium text-fd-foreground">Isolation.</span> The CPU encrypts the room&apos;s memory. The host and the operator cannot read it.</span>
        </div>
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span><span className="font-medium text-fd-foreground">Attestation.</span> The CPU signs a note that names the program inside. You can check that note.</span>
        </div>
      </figcaption>
    </figure>
  );
}
