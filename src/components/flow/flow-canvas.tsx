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


  width: number;
  height: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeEdgeId?: string | null;
  fitViewOptions?: FitViewOptions;
};


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
