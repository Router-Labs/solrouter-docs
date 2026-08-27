'use client';

import {
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type FitViewOptions,
  type NodeMouseHandler,
  type NodeTypes,
  type OnNodesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useMemo } from 'react';
import { BoxNodeCard } from './box-node';
import type { BoxNode, FlowEdge } from './data/types';

/* Module scope on purpose: a new object per render makes React Flow remount every node. */
const nodeTypes: NodeTypes = { box: BoxNodeCard };

const EDGE_LABEL_STYLE = { fill: 'var(--color-fd-muted-foreground)' };
const EDGE_LABEL_BG_STYLE = { fill: 'var(--color-fd-card)' };
const ACTIVE_EDGE_STYLE = { stroke: 'var(--color-fd-primary)', strokeWidth: 3 };
const PRO_OPTIONS = { hideAttribution: false };

export type FlowCanvasProps = {
  nodes: BoxNode[];
  edges: FlowEdge[];
  /* Canvas size in px. React Flow needs both to run fitView on the server. */
  width: number;
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeEdgeId?: string | null;
  fitViewOptions?: FitViewOptions;
};

/* The only file that imports @xyflow/react at runtime, with its stylesheet. */
export function FlowCanvas({
  nodes,
  edges,
  width,
  height,
  selectedId,
  onSelect,
  activeEdgeId = null,
  fitViewOptions,
}: FlowCanvasProps) {
  const viewNodes = useMemo(
    () => nodes.map((n) => ({ ...n, selected: n.id === selectedId })),
    [nodes, selectedId],
  );
  const viewEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        labelStyle: EDGE_LABEL_STYLE,
        labelBgStyle: EDGE_LABEL_BG_STYLE,
        style: e.id === activeEdgeId ? ACTIVE_EDGE_STYLE : undefined,
      })),
    [edges, activeEdgeId],
  );

  const onNodeClick: NodeMouseHandler<BoxNode> = useCallback(
    (_event, node) => onSelect(node.id),
    [onSelect],
  );
  const onPaneClick = useCallback(() => onSelect(null), [onSelect]);
  /* Enter on a focused node arrives as a select change, not as a click. */
  const onNodesChange: OnNodesChange<BoxNode> = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'select' && change.selected) onSelect(change.id);
      }
    },
    [onSelect],
  );

  return (
    <ReactFlowProvider
      initialNodes={viewNodes}
      initialEdges={viewEdges}
      initialWidth={width}
      initialHeight={height}
      fitView
    >
      <ReactFlow
        nodes={viewNodes}
        edges={viewEdges}
        nodeTypes={nodeTypes}
        width={width}
        height={height}
        fitView
        fitViewOptions={fitViewOptions}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
        panOnDrag
        zoomOnPinch
        minZoom={0.4}
        maxZoom={1.5}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesChange={onNodesChange}
        proOptions={PRO_OPTIONS}
      >
        <Controls showInteractive={false} fitViewOptions={fitViewOptions} />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
