'use client';

import {
  BadgeCheck,
  CircleAlert,
  Fingerprint,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

// Live, CORS-enabled read endpoints (no DB; every read goes through Photon).
//   GET /attestation/by-hash/:hash   — 64-char encrypted_prompt_hash
//   GET /attestation/:address        — Light compressed-account address
// Override with NEXT_PUBLIC_API_BASE for local/preview testing.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || 'https://api.solrouter.com';

// The exact tuple the enclave signs inside the TDX CVM, in order:
//   "SOLR-ATTEST-v2" ‖ ciphertextHash(32) ‖ teePubkey(32) ‖ nonce(16)
//   ‖ clientPubkey(32) ‖ [model.len] ‖ model ‖ [provider.len] ‖ provider
const DOMAIN_TAG = 'SOLR-ATTEST-v2';

type Attestation = {
  verified?: boolean;
  version?: 'v1' | 'v2';
  address?: string;
  user?: string;
  encryptedPromptHash: string;
  model: string;
  provider: string;
  timestamp: number;
  backendSawPlaintext: boolean;
  teeProcessed: boolean;
  // v2 proof fields (base64 raw bytes; hashes hex)
  clientPubkey?: string;
  teePubkey?: string;
  nonce?: string;
  enclavePubkey?: string;
  enclaveSigR?: string;
  enclaveSigS?: string;
  tdxQuoteHash?: string;
};

type Verdict =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'error'; message: string }
  | { state: 'v1'; data: Attestation }
  | { state: 'v2'; data: Attestation; signatureValid: boolean; note?: string };

const hexToBytes = (h: string) =>
  Uint8Array.from(h.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));

const b64ToBytes = (b: string) =>
  Uint8Array.from(atob(b), (c) => c.charCodeAt(0));

const utf8 = (s: string) => new TextEncoder().encode(s);

function concatBytes(...arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) {
    out.set(a, o);
    o += a.length;
  }
  return out;
}

/** Accepts a 64-char hash, a Light address, a commit-tx signature, or an explorer URL to any. */
function parseInput(
  raw: string,
): { kind: 'hash' | 'address' | 'tx'; value: string } | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[0-9a-fA-F]{64}$/.test(s)) return { kind: 'hash', value: s.toLowerCase() };

  // Explorer / Solscan URL → take the last path segment, and note /tx/ vs /account/.
  let candidate = s;
  let isTx = false;
  let isAddr = false;
  if (s.includes('/')) {
    try {
      const url = new URL(s.includes('://') ? s : `https://x/${s}`);
      const segs = url.pathname.split('/').filter(Boolean);
      candidate = segs[segs.length - 1] ?? '';
      if (segs.includes('tx')) isTx = true;
      if (segs.includes('account') || segs.includes('address')) isAddr = true;
    } catch {
      const segs = s.split(/[/?#]/).filter(Boolean);
      candidate = segs[segs.length - 1] ?? s;
    }
  }
  candidate = candidate.split(/[?#]/)[0];

  if (/^[0-9a-fA-F]{64}$/.test(candidate))
    return { kind: 'hash', value: candidate.toLowerCase() };
  // A tx signature is ~64–88 base58 chars; an account address is ~32–44.
  if (
    (isTx && /^[1-9A-HJ-NP-Za-km-z]{43,100}$/.test(candidate)) ||
    (!isAddr && /^[1-9A-HJ-NP-Za-km-z]{45,100}$/.test(candidate))
  )
    return { kind: 'tx', value: candidate };
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(candidate))
    return { kind: 'address', value: candidate };
  return null;
}

/** Rebuild the signed tuple and check the enclave's ed25519 signature in-browser. */
async function verifyEnclaveSignature(d: Attestation): Promise<boolean> {
  const message = concatBytes(
    utf8(DOMAIN_TAG),
    hexToBytes(d.encryptedPromptHash), // ciphertextHash (== on-chain hash)
    b64ToBytes(d.teePubkey!), // X25519 sealing key the ciphertext was sealed to
    b64ToBytes(d.nonce!),
    b64ToBytes(d.clientPubkey!),
    new Uint8Array([d.model.length]),
    utf8(d.model),
    new Uint8Array([d.provider.length]),
    utf8(d.provider),
  );
  const signature = concatBytes(
    b64ToBytes(d.enclaveSigR!),
    b64ToBytes(d.enclaveSigS!),
  );
  const key = await crypto.subtle.importKey(
    'raw',
    b64ToBytes(d.enclavePubkey!) as BufferSource,
    { name: 'Ed25519' },
    false,
    ['verify'],
  );
  return crypto.subtle.verify(
    'Ed25519',
    key,
    signature as BufferSource,
    message as BufferSource,
  );
}

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-fd-border/60 py-2 last:border-0 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="w-40 shrink-0 text-xs uppercase tracking-wide text-fd-muted-foreground">
        {label}
      </span>
      <span
        className={`break-all text-sm text-fd-foreground ${mono ? 'font-mono text-[13px]' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {ok ? (
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
      ) : (
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
      )}
      <span className={ok ? 'text-fd-foreground' : 'text-fd-muted-foreground'}>
        {children}
      </span>
    </li>
  );
}

export function EncryptionProofVerifier() {
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<Verdict>({ state: 'idle' });

  async function run() {
    const parsed = parseInput(input);
    if (!parsed) {
      setVerdict({
        state: 'error',
        message:
          'Could not read that. Paste a Solana Explorer link, the Light attestation address, or the 64-character encrypted-prompt hash.',
      });
      return;
    }
    setVerdict({ state: 'loading' });
    try {
      const url =
        parsed.kind === 'hash'
          ? `${API_BASE}/attestation/by-hash/${parsed.value}`
          : parsed.kind === 'tx'
            ? `${API_BASE}/attestation/by-tx/${parsed.value}`
            : `${API_BASE}/attestation/${parsed.value}`;
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.status === 404) {
        setVerdict({
          state: 'error',
          message:
            'No attestation found on-chain for that identifier. Double-check the hash or address.',
        });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setVerdict({
          state: 'error',
          message: body?.error || `Lookup failed (HTTP ${res.status}).`,
        });
        return;
      }
      const data: Attestation = await res.json();

      // v1 attestation — committed, but no enclave signature to check.
      if (data.version !== 'v2' || !data.enclavePubkey) {
        setVerdict({ state: 'v1', data });
        return;
      }

      // v2 — verify the enclave's ed25519 signature client-side.
      try {
        const signatureValid = await verifyEnclaveSignature(data);
        setVerdict({ state: 'v2', data, signatureValid });
      } catch (e) {
        // Most likely: browser without WebCrypto Ed25519 support.
        setVerdict({
          state: 'v2',
          data,
          signatureValid: false,
          note:
            'Your browser could not run the Ed25519 check locally. The proof fields are shown below — verify them with any Ed25519 library.',
        });
      }
    } catch {
      setVerdict({
        state: 'error',
        message:
          'Network error reaching the attestation endpoint. Check your connection and try again.',
      });
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-fd-border bg-fd-card/40">
      <div className="flex items-center gap-2 border-b border-fd-border bg-fd-muted/40 px-5 py-3">
        <Fingerprint className="h-4 w-4 text-fd-primary" aria-hidden />
        <span className="text-sm font-medium text-fd-foreground">
          Verify an encryption proof
        </span>
      </div>

      <div className="p-5">
        <p className="mb-3 text-sm text-fd-muted-foreground">
          Paste a Solana Explorer link, the Light attestation address, or the
          64-character encrypted-prompt hash. We fetch the on-chain record and
          verify the enclave&rsquo;s signature in your browser — nothing is sent
          anywhere except the public read endpoint.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-3">
            <Search className="h-4 w-4 shrink-0 text-fd-muted-foreground" aria-hidden />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') run();
              }}
              spellCheck={false}
              placeholder="explorer.solana.com/address/… · hash · address"
              aria-label="Attestation hash, address, or explorer link"
              className="w-full bg-transparent py-2.5 font-mono text-[13px] text-fd-foreground outline-none placeholder:text-fd-muted-foreground/60"
            />
          </div>
          <button
            type="button"
            onClick={run}
            disabled={verdict.state === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {verdict.state === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <ShieldCheck className="h-4 w-4" aria-hidden />
            )}
            Verify
          </button>
        </div>

        {verdict.state === 'error' && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-fd-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            <span>{verdict.message}</span>
          </div>
        )}

        {verdict.state === 'v1' && (
          <div className="mt-4 rounded-lg border border-fd-border bg-fd-background p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-fd-foreground">
              <Lock className="h-4 w-4 text-fd-primary" aria-hidden />
              Committed on-chain (v1)
            </div>
            <p className="mt-1 text-sm text-fd-muted-foreground">
              This is a v1 attestation: the encrypted-prompt hash is recorded
              on-chain, but it predates the enclave-signed proof, so there is no
              signature to verify here.
            </p>
            <div className="mt-3">
              <Row label="Encrypted hash" value={verdict.data.encryptedPromptHash} />
              <Row label="Model" value={verdict.data.model} mono={false} />
              <Row label="Provider" value={verdict.data.provider} mono={false} />
              <Row
                label="Backend saw plaintext"
                value={verdict.data.backendSawPlaintext ? 'true' : 'false'}
                mono={false}
              />
            </div>
          </div>
        )}

        {verdict.state === 'v2' && (
          <div
            className={`mt-4 rounded-lg border p-4 ${
              verdict.signatureValid
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-fd-foreground">
              {verdict.signatureValid ? (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />
                  Enclave signature verified
                </>
              ) : (
                <>
                  <ShieldX className="h-5 w-5 text-red-500" aria-hidden />
                  {verdict.note ? 'Proof fetched — check it yourself' : 'Signature did NOT verify'}
                </>
              )}
            </div>

            {verdict.note && (
              <p className="mt-1 text-sm text-fd-muted-foreground">{verdict.note}</p>
            )}

            {verdict.signatureValid && (
              <ul className="mt-3 flex flex-col gap-1.5">
                <Check ok>
                  An Intel TDX&ndash;attested enclave signed this exact ciphertext
                  hash with its own attested key.
                </Check>
                <Check ok>
                  The signing key never leaves the enclave — Solrouter&rsquo;s
                  backend cannot forge this record.
                </Check>
                <Check ok>
                  The attestation is committed immutably on Solana mainnet.
                </Check>
              </ul>
            )}

            <div className="mt-4">
              <Row label="Encrypted hash" value={verdict.data.encryptedPromptHash} />
              <Row label="Enclave pubkey" value={verdict.data.enclavePubkey!} />
              <Row label="TEE sealing key" value={verdict.data.teePubkey!} />
              <Row label="TDX quote hash" value={verdict.data.tdxQuoteHash!} />
              <Row label="Model" value={verdict.data.model} mono={false} />
              <Row label="Provider" value={verdict.data.provider} mono={false} />
              <Row
                label="Backend saw plaintext"
                value={verdict.data.backendSawPlaintext ? 'true' : 'false'}
                mono={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
