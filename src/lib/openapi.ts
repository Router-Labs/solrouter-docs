import { createOpenAPI } from 'fumadocs-openapi/server';

// Agent Privacy API schema (Solrouter /agents/v1). Snapshot committed at
// ./openapi/agent-privacy.json — refresh it from the live spec when the API changes:
//   curl https://solrouter-obb4.onrender.com/agents/v1/openapi.json -o openapi/agent-privacy.json
export const openapi = createOpenAPI({
  input: ['./openapi/agent-privacy.json'],
});
