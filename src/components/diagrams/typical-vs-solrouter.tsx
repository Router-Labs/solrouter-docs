'use client';

import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Eye, EyeOff, KeyRound, Lock, Server, User, Zap, type LucideIcon } from 'lucide-react';

type ChipData = {
  icon: keyof typeof ICONS;
  label: string;
  accent?: boolean;
  danger?: boolean;
};
type LaneData = { label: string };

const ICONS = { User, Eye, EyeOff, Server, Lock, KeyRound, Zap } satisfies Record<string, LucideIcon>;

const CHIP_W = 150;
const CHIP_H = 52;

function ChipNode({ data }: NodeProps<Node<ChipData>>) {
  const Icon = ICONS[data.icon];
  const tone = data.accent
    ? 'border-fd-primary/40 bg-fd-primary/10'
    : data.danger
      ? 'border-amber-500/40 bg-amber-500/10'
      : 'border-fd-border bg-fd-card';
  const iconTone = data.accent
    ? 'text-fd-primary'
    : data.danger
      ? 'text-amber-600 dark:text-amber-300'
      : 'text-fd-muted-foreground';
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 text-fd-foreground ${tone}`}
      style={{ width: CHIP_W, height: CHIP_H }}
    >
      <Handle type="target" position={Position.Left} className="!opacity-0" />
      <Icon className={`h-4 w-4 shrink-0 ${iconTone}`} aria-hidden />
      <span className="text-xs font-semibold leading-tight">{data.label}</span>
      <Handle type="source" position={Position.Right} className="!opacity-0" />
    </div>
  );
}

function LaneNode({ data }: NodeProps<Node<LaneData>>) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wide text-fd-muted-foreground">
      {data.label}
    </div>
  );
}

const nodeTypes = { chip: ChipNode, lane: LaneNode };

function chip(id: string, x: number, y: number, data: ChipData): Node<ChipData> {
  return { id, type: 'chip', position: { x, y }, data, width: CHIP_W, height: CHIP_H, draggable: false, selectable: false };
}
function lane(id: string, x: number, y: number, label: string): Node<LaneData> {
  return { id, type: 'lane', position: { x, y }, data: { label }, draggable: false, selectable: false };
}

const AMBER = '#d97706';
const GREEN = '#059669';

function wire(id: string, source: string, target: string, label: string, safe: boolean): Edge {
  const color = safe ? GREEN : AMBER;
  return {
    id,
    source,
    target,
    label,
    type: 'smoothstep',
    style: { stroke: color, strokeWidth: 1.5 },
    labelStyle: { fill: color, fontSize: 11, fontWeight: 600 },
    labelBgStyle: { fill: 'var(--color-fd-background)' },
    labelBgPadding: [4, 2],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
  };
}

const nodes: Node[] = [
  lane('lane1', 0, -42, 'Typical AI API'),
  chip('you1', 0, 0, { icon: 'User', label: 'You' }),
  chip('prov', 240, 0, { icon: 'Eye', label: 'Provider server', danger: true }),
  chip('model1', 480, 0, { icon: 'Server', label: 'Model' }),

  lane('lane2', 0, 108, 'Solrouter, encryption on'),
  chip('you2', 0, 150, { icon: 'Lock', label: 'You', accent: true }),
  chip('backend', 220, 150, { icon: 'EyeOff', label: 'Solrouter backend' }),
  chip('enclave', 440, 150, { icon: 'KeyRound', label: 'TDX enclave', accent: true }),
  chip('gpu', 660, 150, { icon: 'Zap', label: 'Nosana GPU' }),
];

const edges: Edge[] = [
  wire('e1', 'you1', 'prov', 'plaintext', false),
  wire('e2', 'prov', 'model1', 'plaintext', false),
  wire('e3', 'you2', 'backend', 'ciphertext', true),
  wire('e4', 'backend', 'enclave', 'ciphertext', true),
  wire('e5', 'enclave', 'gpu', 'plaintext / TLS', false),
];

/**
 * Before and after, as a React Flow graph. Row 1: a typical AI API reads your
 * prompt in plaintext. Row 2: Solrouter relays ciphertext and only the enclave
 * opens it. The plaintext/ciphertext state lives on the edges, not in the boxes.
 */
export function TypicalVsSolrouter() {
  return (
    <figure
      role="img"
      aria-label="Two rows. In a typical AI API your prompt travels in plaintext to the provider server, which reads it, then to the model. With Solrouter and encryption on, your device sends ciphertext, the Solrouter backend relays it without reading it, the TDX enclave opens it, and the Nosana GPU node runs the model over TLS."
      className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-4"
    >
      <div className="h-[260px] w-full">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.12 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnDrag={false}
            panOnScroll={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
          />
        </ReactFlowProvider>
      </div>
      <figcaption className="mt-1 text-center text-xs text-fd-muted-foreground">
        The reply returns encrypted from the enclave. The backend never sees the text.
      </figcaption>
    </figure>
  );
}
