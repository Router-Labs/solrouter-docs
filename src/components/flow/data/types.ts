import { Position, type Edge, type Node } from '@xyflow/react';


export type NodeDetail = {
  holds: string;
  sees: string;
  status?: string;
  /* Monorepo file:line, or "not determined". */
  source: string;

export type FlowStep = {
  id: string;
  label: string;
  nodeId: string;
  edgeId?: string;
  payload: string;
  source: string;
};

export const BOX_WIDTH = 220;
export const BOX_HEIGHT = 84;


export function flowEdge(source: string, target: string, label?: string): FlowEdge {
  return { id: `${source}__${target}`, source, target, label };
}
