'use client';

import { BadgeCheck, CircleAlert, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

// GET /tee/attestation -> { teeType, teePublicKey, teePublicKeySha256, reportDataHex, tdxQuote, generatedAt }
// tdxQuote = { quote (hex), event_log, hash_algorithm: 'sha512', prefix: 'app-data' }
//
// Chain, as produced by tee-service through Phala's dstack guest agent:
//   reportDataHex      = sha256(teePublicKey)
//   quote.report_data  = sha512(utf8(prefix + ':') || reportData bytes)
// report_data sits at byte 568 of a v4 quote: 48-byte header + 520 bytes into the TD report body.
// This widget checks the binding only. Intel's signature chain is checked at proof.t16z.com.
// Override the host with NEXT_PUBLIC_API_BASE for local testing.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.solrouter.com';
const REPORT_DATA_OFFSET = 568;
const TDX_TEE_TYPE = 0x81;

type Attestation = {
  teeType?: string;
  teePublicKey?: string;
  reportDataHex?: string;
  tdxQuote?: { quote?: string; hash_algorithm?: string; prefix?: string } | null;
  generatedAt?: number;
};

type Check = { label: string; detail: string; ok: boolean };
type Result = { teeType: string; checks: Check[]; quoteHex: string; generatedAt?: string };

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (x) => parseInt(x, 16));
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function digestHex(alg: 'SHA-256' | 'SHA-512', bytes: Uint8Array): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest(alg, bytes as BufferSource)));
}

async function verify(a: Attestation): Promise<Result> {
  const quoteHex = a.tdxQuote?.quote ?? '';
  const quote = fromHex(quoteHex);
  const hasHeader = quote.length >= REPORT_DATA_OFFSET + 64;
  const view = new DataView(quote.buffer);
  const version = hasHeader ? view.getUint16(0, true) : 0;
  const teeType = hasHeader ? view.getUint32(4, true) : 0;
  const inQuote = hasHeader ? toHex(quote.slice(REPORT_DATA_OFFSET, REPORT_DATA_OFFSET + 64)) : '';

  const keyHash = a.teePublicKey ? await digestHex('SHA-256', fromB64(a.teePublicKey)) : '';
  const reportDataHex = (a.reportDataHex || '').toLowerCase();

  let bound = '';
  if (a.tdxQuote?.hash_algorithm === 'sha512' && reportDataHex) {
    const prefix = new TextEncoder().encode(`${a.tdxQuote.prefix}:`);
    const data = fromHex(reportDataHex);
    const msg = new Uint8Array(prefix.length + data.length);
    msg.set(prefix);
    msg.set(data, prefix.length);
    bound = await digestHex('SHA-512', msg);
  }

  return {
    teeType: a.teeType || 'unknown',
    quoteHex,
    generatedAt: a.generatedAt ? new Date(a.generatedAt).toISOString() : undefined,
    checks: [
      {
        label: 'Intel TDX quote',
        detail: hasHeader ? `version ${version}, TEE type 0x${teeType.toString(16)}` : 'no quote in the response',
        ok: version === 4 && teeType === TDX_TEE_TYPE,
      },
      {
        label: 'sha256(teePublicKey) = reportDataHex',
        detail: keyHash || '(no key)',
        ok: !!keyHash && keyHash === reportDataHex,
      },
      {
        label: 'sha512("app-data:" || reportData) = report_data at byte 568',
        detail: inQuote || '(missing)',
        ok: bound !== '' && bound === inQuote,
      },
    ],
  };
}

export function KeyQuoteInspector() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch(`${API_BASE}/tee/attestation`);
      if (!res.ok) throw new Error(`GET /tee/attestation returned ${res.status}`);
      setResult(await verify((await res.json()) as Attestation));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function copyQuote() {
    if (!result?.quoteHex) return;
    try {
      await navigator.clipboard.writeText(result.quoteHex);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const ok = result?.checks.every((c) => c.ok);

  return (
    <div className="not-prose my-6 rounded-2xl border border-fd-border bg-fd-card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Check the live enclave
        </button>
        <span className="text-xs text-fd-muted-foreground">
          Fetches <code>/tee/attestation</code> from your browser.
        </span>
      </div>

      <div aria-live="polite" className="mt-4 text-sm">
        {error ? (
          <p className="flex items-start gap-2 text-fd-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : null}
        {result ? (
          <div className="space-y-3">
            <p className="flex items-center gap-2 font-medium text-fd-foreground">
              {ok ? <BadgeCheck className="h-4 w-4" aria-hidden /> : <CircleAlert className="h-4 w-4" aria-hidden />}
              {ok ? 'The key you seal to is bound into the live TDX quote.' : 'A check did not pass. Read the rows below.'}
            </p>
            <ul className="m-0 list-none p-0">
              {result.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 border-t border-fd-border py-2">
                  <span
                    className={`mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${
                      c.ok ? 'bg-fd-primary text-fd-primary-foreground' : 'border border-fd-border text-fd-muted-foreground'
                    }`}
                    aria-label={c.ok ? 'passed' : 'failed'}
                  >
                    {c.ok ? '✓' : '✕'}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-fd-foreground">{c.label}</span>
                    <span className="block break-all font-mono text-xs text-fd-muted-foreground">{c.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-fd-muted-foreground">
              Enclave <code>{result.teeType}</code>
              {result.generatedAt ? (
                <>
                  , quote generated <code>{result.generatedAt}</code>
                </>
              ) : null}
              . This checks the key binding. Intel&apos;s signature on the quote is checked by Phala&apos;s verifier.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyQuote}
                disabled={!result.quoteHex}
                className="inline-flex items-center rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium text-fd-foreground hover:bg-fd-accent disabled:opacity-60"
              >
                {copied ? 'Quote copied' : 'Copy quote'}
              </button>
              <a
                href="https://proof.t16z.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-lg border border-fd-border px-3 py-1.5 text-xs font-medium text-fd-foreground no-underline hover:bg-fd-accent"
              >
                Open Phala verifier
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
