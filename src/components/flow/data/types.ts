import { Position, type Edge, type Node } from '@xyflow/react';

/* Icon keys the box node can draw. A string keeps node data serialisable. */
export type IconName =
  | 'User'
  | 'Server'
  | 'Cpu'
  | 'Zap'
  | 'Link2'
  | 'Coins'
  | 'Plug'
  | 'MessageSquare'
  | 'Code'
  | 'Shuffle'
  | 'Landmark'
  | 'Database'
  | 'Globe'
  | 'ShieldCheck';

/* What the detail panel shows when a node is selected. */
export type NodeDetail = {
  holds: string;
  sees: string;
  status?: string;
  /* Monorepo file:line, or "not determined". */
  source: string;
  /* Deep-dive page for this node. */
  href?: string;
};

export type BoxNodeData = {
  icon: IconName;
  title: string;
  sub: string;
  status?: string;
  accent?: boolean;
  active?: boolean;
  detail: NodeDetail;
};

export type BoxNode = Node<BoxNodeData, 'box'>;
export type FlowEdge = Edge;

/* One hop in a stepper. edgeId is absent when the hop stays inside one node. */
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

/* Build one box node. Size and handles are fixed so the server can draw edges. */
export function boxNode(id: string, x: number, y: number, data: BoxNodeData): BoxNode {
  return {
    id,
    type: 'box',
    position: { x, y },
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    handles: [
      { type: 'target', position: Position.Left, x: 0, y: BOX_HEIGHT / 2 },
      { type: 'source', position: Position.Right, x: BOX_WIDTH, y: BOX_HEIGHT / 2 },
    ],
    data,
  };
}

/* Edge ids use two underscores so they never collide with a node id. */
export function flowEdge(source: string, target: string, label?: string): FlowEdge {
  return { id: `${source}__${target}`, source, target, label };
}
