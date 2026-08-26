'use client';

import { BadgeCheck, CircleAlert, Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';

// Live, CORS-enabled read endpoints (checked 2026-08-26 with an Origin header):
//   GET /tee/public-key   -> { publicKey, publicKeySha256, algorithm, teeType }
//   GET /tee/attestation  -> { teeType, teePublicKey, teePublicKeySha256, reportDataHex, tdxQuote, generatedAt }
// The GET quote pins report_data = sha256(X25519 public key). This widget recomputes
// that hash in the browser and compares it with reportDataHex. Override the host
// with NEXT_PUBLIC_API_BASE for local testing.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.solrouter.com';

type PublicKey = { publicKey: string; publicKeySha256?: string; algorithm?: string; teeType?: string };
type Attestation = {
  teeType?: string;
  teePublicKey?: string;
  teePublicKeySha256?: string;
  reportDataHex?: string;
  tdxQuote?: unknown;
  tdxQuoteError?: string;
  generatedAt?: number;
};

type Result = {
  teeType: string;
  keyMatches: boolean;
  hashMatches: boolean;
  quotePresent: boolean;
  quoteError?: string;
  computedSha256: string;
  reportDataHex: string;
  generatedAt?: string;
};

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function KeyQuoteInspector() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const [keyRes, attRes] = await Promise.all([
        fetch(`${API_BASE}/tee/public-key`),
        fetch(`${API_BASE}/tee/attestation`),
      ]);
      if (!keyRes.ok) throw new Error(`GET /tee/public-key returned ${keyRes.status}`);
      if (!attRes.ok) throw new Error(`GET /tee/attestation returned ${attRes.status}`);
      const key = (await keyRes.json()) as PublicKey;
      const att = (await attRes.json()) as Attestation;
      const computed = await sha256Hex(base64ToBytes(key.publicKey));
      const reportDataHex = (att.reportDataHex || '').toLowerCase();
      setResult({
        teeType: att.teeType || key.teeType || 'unknown',
        keyMatches: !!att.teePublicKey && att.teePublicKey === key.publicKey,
        hashMatches: reportDataHex.startsWith(computed),
        quotePresent: att.tdxQuote !== null && att.tdxQuote !== undefined,
        quoteError: att.tdxQuoteError,
        computedSha256: computed,
        reportDataHex,
        generatedAt: att.generatedAt ? new Date(att.generatedAt).toISOString() : undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const ok = result && result.keyMatches && result.hashMatches && result.quotePresent;

  return (
    <div className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Check the live enclave key
        </button>
        <span className="text-xs text-fd-muted-foreground">
          Fetches <code>/tee/public-key</code> and <code>/tee/attestation</code> from your browser.
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
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium text-fd-foreground">
              {ok ? <BadgeCheck className="h-4 w-4" aria-hidden /> : <CircleAlert className="h-4 w-4" aria-hidden />}
              {ok ? 'The published key is bound into the live TDX quote.' : 'Something did not match. Read the rows below.'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <tbody>
                  <Row label="TEE type" value={result.teeType} />
                  <Row label="Same key on both endpoints" value={result.keyMatches ? 'yes' : 'no'} />
                  <Row label="sha256(publicKey), computed here" value={result.computedSha256} mono />
                  <Row label="report_data from the quote" value={result.reportDataHex || '(missing)'} mono />
                  <Row label="Hash matches report_data" value={result.hashMatches ? 'yes' : 'no'} />
                  <Row label="Quote present" value={result.quotePresent ? 'yes' : `no${result.quoteError ? `: ${result.quoteError}` : ''}`} />
                  {result.generatedAt ? <Row label="Quote generated at" value={result.generatedAt} mono /> : null}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-fd-muted-foreground">
              This check proves the key you encrypt to is the key the quote names. It does not verify the Intel
              signature chain. For that, run the quote through Intel DCAP tools.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <tr className="border-t border-fd-border">
      <th scope="row" className="py-1 pr-3 text-left font-medium text-fd-muted-foreground">
        {label}
      </th>
      <td className={`py-1 text-fd-foreground ${mono ? 'break-all font-mono' : ''}`}>{value}</td>
    </tr>
  );
}
