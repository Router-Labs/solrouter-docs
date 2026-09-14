'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, Server, User } from 'lucide-react';

// Blur demos for the docs, matching the site's hover-to-open effect. They
// illustrate who can read a prompt; they are not a security control.

const DEFAULT_PROMPT = 'review this contract before friday';
const CIPHER = '9f3a0c71e2b84d5a6c1f07be93d24a88c4e17b0d5e2a';
const GLYPHS = '0123456789abcdef';

/** Animates 0 → 1 while `open`, back to 0 when not. */
function useOpenProgress(open: boolean) {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const target = open ? 1 : 0;
    const step = (now: number) => {
      const dt = (now - last) / 650;
      last = now;
      setP((x) => {
        const next = target > x ? Math.min(target, x + dt) : Math.max(target, x - dt * 1.4);
        if (next !== target) raf = requestAnimationFrame(step);
        return next;
      });
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open]);
  return p;
}

/** Touch screens have no hover, so demos loop on their own there. */
function useTouchLoop(ms = 2600) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia?.('(hover: none)').matches) return;
    const t = setInterval(() => setOn((v) => !v), ms);
    return () => clearInterval(t);
  }, [ms]);
  return on;
}

function scramble(plain: string, p: number) {
  const k = Math.round(p * plain.length);
  const edge = Array.from({ length: Math.min(3, plain.length - k) }, (_, i) => GLYPHS[(k * 7 + i * 5) % 16]).join('');
  const rest = CIPHER.repeat(3).slice(k + edge.length, plain.length);
  return { plain: plain.slice(0, k), sealed: edge + rest };
}

function SealedLine({ text, p }: { text: string; p: number }) {
  const s = scramble(text, p);
  return (
    <span className="inline-block font-mono text-sm" style={{ filter: `blur(${((1 - p) * 3.2).toFixed(2)}px)` }}>
      <span className="text-fd-foreground">{s.plain}</span>
      <span className="text-fd-muted-foreground">{s.sealed}</span>
    </span>
  );
}

/** One prompt: blurred ciphertext that opens on hover into what the enclave reads. */
export function SealedPrompt({ prompt = DEFAULT_PROMPT }: { prompt?: string }) {
  const [hover, setHover] = useState(false);
  const loop = useTouchLoop();
  const p = useOpenProgress(hover || loop);
  const opened = p > 0.5;
  return (
    <figure
      className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5 outline-none"
      tabIndex={0}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-label={`A sealed prompt. Hover to see what the enclave reads: "${prompt}".`}
    >
      <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {opened ? <KeyRound className="h-3.5 w-3.5" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
          {opened ? 'What the enclave reads' : 'What leaves your machine'}
        </span>
        <span className="hidden sm:inline" style={{ opacity: 1 - p }}>
          Hover to open
        </span>
      </div>
      <div
        className={`overflow-hidden whitespace-nowrap rounded-xl border px-4 py-3 transition-colors ${
          opened ? 'border-fd-foreground/30 bg-fd-background' : 'border-fd-border bg-fd-muted/60'
        }`}
      >
        <SealedLine text={prompt} p={p} />
      </div>
      <figcaption className="mt-3 flex justify-between font-mono text-xs text-fd-muted-foreground">
        <span>{opened ? 'opened in Intel TDX' : 'sealed · fresh X25519 key per request'}</span>
        <span>RescueCipher</span>
      </figcaption>
    </figure>
  );
}

/** The same prompt as three parties see it. Only the enclave column opens. */
export function WhoSeesWhat({ prompt = 'review my NDA' }: { prompt?: string }) {
  const [hover, setHover] = useState(false);
  const loop = useTouchLoop();
  const p = useOpenProgress(hover || loop);
  const cols = [
    { icon: User, who: 'You', note: 'Typed it', view: <span className="font-mono text-sm text-fd-foreground">{prompt}</span> },
    {
      icon: Server,
      who: 'Solrouter backend',
      note: 'Relays it, has no key',
      view: <SealedLine text={prompt} p={0} />,
    },
    {
      icon: KeyRound,
      who: 'Intel TDX enclave',
      note: p > 0.5 ? 'Holds the key, opens it' : 'Hover to open',
      view: <SealedLine text={prompt} p={p} />,
    },
  ];
  return (
    <figure
      className="not-prose my-6 grid gap-3 rounded-2xl border border-fd-border bg-fd-card/40 p-5 md:grid-cols-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`The same prompt seen three ways. You see "${prompt}". The Solrouter backend sees only ciphertext it cannot open. The Intel TDX enclave opens it.`}
    >
      {cols.map(({ icon: Icon, who, note, view }) => (
        <div key={who} className="min-w-0 rounded-xl border border-fd-border bg-fd-background p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-fd-foreground">
            <Icon className="h-4 w-4 text-fd-muted-foreground" aria-hidden />
            {who}
          </div>
          <div className="overflow-hidden whitespace-nowrap rounded-lg bg-fd-muted/50 px-3 py-2">{view}</div>
          <div className="mt-2 text-xs text-fd-muted-foreground">{note}</div>
        </div>
      ))}
    </figure>
  );
}

/** A small mock chat showing the app's privacy screen: blurred until hovered or tapped. */
export function PrivacyScreenDemo() {
  const [on, setOn] = useState(true);
  const [revealed, setRevealed] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const messages = [
    { me: true, text: 'Summarise my blood test results and flag anything off.' },
    { me: false, text: 'Your ferritin is below range and vitamin D is borderline. Everything else is normal.' },
  ];
  return (
    <figure className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5" ref={ref}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">Chat preview</span>
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          aria-pressed={on}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            on ? 'bg-fd-foreground text-fd-background' : 'border border-fd-border text-fd-muted-foreground'
          }`}
        >
          {on ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
          Privacy screen
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <div key={i} className={m.me ? 'flex justify-end' : ''}>
            <div
              tabIndex={0}
              onMouseEnter={() => setRevealed(i)}
              onMouseLeave={() => setRevealed(null)}
              onFocus={() => setRevealed(i)}
              onBlur={() => setRevealed(null)}
              onPointerDown={(e) => e.pointerType !== 'mouse' && setRevealed((r) => (r === i ? null : i))}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm outline-none transition-[filter] duration-300 ${
                m.me ? 'bg-fd-muted text-fd-foreground' : 'border border-fd-border bg-fd-background text-fd-foreground'
              }`}
              style={{ filter: on && revealed !== i ? 'blur(6px)' : 'none' }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <figcaption className="mt-3 text-xs text-fd-muted-foreground">
        Hover or tap a message to read it. The privacy screen is for screen-sharing and demos; it does not change how messages are encrypted.
      </figcaption>
    </figure>
  );
}
