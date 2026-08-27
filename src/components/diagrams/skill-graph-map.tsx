'use client';

import {
  skillGraphEdges,
  skillGraphNodes,
  skillGraphSteps,
} from '@/components/flow/data/skill-graph';
import { FlowFigure } from '@/components/flow/flow-figure';

export function SkillGraphMap() {
  return (
    <FlowFigure
      ariaLabel="The base skill graph: 44 knowledge nodes from skillGraphEngine.js in five clusters (research and analysis, ecosystem, DeFi protocols, infrastructure and oracles, Solana development), joined by the edges arrays the engine defines, with the example traversal defi-analysis to liquidity-risk to comparative-analysis."
      nodes={skillGraphNodes}
      edges={skillGraphEdges}
      steps={skillGraphSteps}
    />
  );
}
