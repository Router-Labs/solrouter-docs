/*
 * Request-flow stepper data (design section 6, row 26).
 * Node subset of system-map.ts. Step sources were read in the monorepo on 2026-08-26.
 */
import { flowEdge, type BoxNode, type FlowEdge, type FlowStep } from './types';
import { systemMapNodes } from './system-map';

const POSITIONS: Record<string, { x: number; y: number }> = {
  sdk: { x: 0, y: 110 },
  backend: { x: 330, y: 110 },
  cvm: { x: 660, y: 0 },
  nosana: { x: 990, y: 0 },
  solana: { x: 660, y: 220 },
};

/* Reuse the system-map nodes so both diagrams say the same thing about each box. */
export const requestFlowNodes: BoxNode[] = systemMapNodes
  .filter((n) => n.id in POSITIONS)
  .map((n) => ({ ...n, position: POSITIONS[n.id] }));

export const requestFlowEdges: FlowEdge[] = [
  flowEdge('sdk', 'backend', 'ciphertext'),
  flowEdge('backend', 'cvm', 'ciphertext'),
  flowEdge('cvm', 'nosana', 'plaintext over TLS'),
  flowEdge('backend', 'solana', 'receipt commit'),
];

export const requestFlowSteps: FlowStep[] = [
  {
    id: 'key',
    label: 'Fetch the enclave key',
    nodeId: 'sdk',
    edgeId: 'sdk__backend',
    payload: 'GET /tee/public-key -> {publicKey, publicKeySha256, algorithm, teeType}. Cached per process.',
    source: 'be:packages/sdk/src/encryption.ts:73-95; be:tee-service/src/index.js:805-812',
  },
  {
    id: 'keypair',
    label: 'Ephemeral keypair',
    nodeId: 'sdk',
    payload: 'Ephemeral X25519 keypair, then the shared secret with the enclave key.',
    source: 'be:packages/sdk/src/encryption.ts:61-68,116',
  },
  {
    id: 'encrypt',
    label: 'Encrypt',
    nodeId: 'sdk',
    payload: "RescueCipher, packed-31 -> {ciphertext, nonce, publicKey, version: '2.0-packed31'}",
    source: 'be:packages/sdk/src/encryption.ts:17-18,111-143',
  },
  {
    id: 'post',
    label: 'POST /tee/process',
    nodeId: 'sdk',
    edgeId: 'sdk__backend',
    payload: 'POST /tee/process with a Bearer key. What leaves the machine: the ciphertext bundle {ciphertext, nonce, publicKey, version} plus, in plaintext, the API key, model id, chatId, and the optional systemPrompt, useRAG, ragCollection, useLiveSearch.',
    source: 'be:packages/sdk/src/client.ts:180-193; be:routes/tee.js:33-46',
  },
  {
    id: 'relay',
    label: 'Blind relay',
    nodeId: 'backend',
    edgeId: 'backend__cvm',
    payload: 'Backend forwards {encryptedPrompt, model, privacyAttestationId} unchanged.',
    source: 'be:routes/tee.js:50-54',
  },
  {
    id: 'decrypt',
    label: 'CVM decrypts',
    nodeId: 'cvm',
    payload: 'CVM derives the shared secret with its X25519 private key and decrypts.',
    source: 'be:tee-service/src/index.js:321-329',
  },
  {
    id: 'infer',
    label: 'Model call',
    nodeId: 'cvm',
    edgeId: 'cvm__nosana',
    payload: 'CVM calls the configured Nosana endpoint URL at /v1/chat/completions with the plaintext (HTTPS per the documented node URL, not re-verified).',
    source: 'be:tee-service/src/index.js:456-474',
  },
  {
    id: 'seal',
    label: 'Seal and sign',
    nodeId: 'cvm',
    payload: 'CVM encrypts the reply to your key, signs the SOLR-ATTEST-v2 tuple, requests the tappd quote with report_data = sha256(x25519 || ed25519).',
    source: 'be:tee-service/src/index.js:382-389,107-119,96-101,217-221',
  },
  {
    id: 'commit',
    label: 'Receipt and reply',
    nodeId: 'backend',
    edgeId: 'backend__solana',
    payload: "Backend commits the compressed account and returns {success, encryptedResponse, attestation (with the per-request tdxQuote or tdxQuoteError), encryptionProof, requestId, metadata, backendRole: 'BLIND_RELAY', onchainAttestation {type, address, encryptedPromptHash, signature, explorerUrl, alreadyExists} | null, privacyProof {backendSawPlaintext: false, decryptionLocation: 'PHALA_TDX_CVM', attestationVerifiable}}.",
    source: 'be:routes/tee.js:57-73,84-101',
  },
  {
    id: 'read',
    label: 'SDK decrypts',
    nodeId: 'sdk',
    payload: 'SDK decrypts encryptedResponse with the session private key.',
    source: 'be:packages/sdk/src/client.ts:215-216',
  },
];
