'use client';

import {
  requestFlowEdges,
  requestFlowNodes,
  requestFlowSteps,
} from '@/components/flow/data/request-flow';
import { FlowFigure } from '@/components/flow/flow-figure';

export function RequestFlowStepper() {
  return (
    <FlowFigure
      ariaLabel="The TEE request flow in ten steps: the SDK fetches the enclave key, makes an ephemeral keypair, encrypts with RescueCipher, posts the ciphertext to the backend, the backend relays it to the CVM, the CVM decrypts and calls the Nosana model over TLS, encrypts and signs the reply, the backend commits the receipt to Solana and returns the encrypted reply, and the SDK decrypts it."
      nodes={requestFlowNodes}
      edges={requestFlowEdges}
      steps={requestFlowSteps}
    />
  );
}
