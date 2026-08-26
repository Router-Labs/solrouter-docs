'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Code,
  Coins,
  Cpu,
  Database,
  Globe,
  Landmark,
  Link2,
  MessageSquare,
  Plug,
  Server,
  ShieldCheck,
  Shuffle,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { BoxNode, IconName } from './data/types';

const ICONS: Record<IconName, LucideIcon> = {
  User,
  Server,
  Cpu,
  Zap,
  Link2,
  Coins,
  Plug,
  MessageSquare,
  Code,
  Shuffle,
  Landmark,
  Database,
  Globe,
  ShieldCheck,
};

/* The one custom node type. Size must match BOX_WIDTH and BOX_HEIGHT in data/types.ts. */
export function BoxNodeCard({ data, selected }: NodeProps<BoxNode>) {
  const Icon = ICONS[data.icon];
  const ring = data.active
    ? 'ring-2 ring-fd-primary'
    : selected
      ? 'ring-2 ring-fd-ring/60'
      : '';
  return (
    <div
      className={`flex h-[84px] w-[220px] items-center gap-3 rounded-xl border border-fd-border bg-fd-card px-3 text-left text-fd-foreground ${ring}`}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          data.accent
            ? 'bg-fd-primary/15 text-fd-primary'
            : 'bg-fd-muted text-fd-muted-foreground'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{data.title}</div>
        <div className="truncate text-xs leading-snug text-fd-muted-foreground">
          {data.sub}
        </div>
        {data.status ? (
          <div className="text-[10px] font-medium uppercase tracking-wide text-fd-muted-foreground">
            {data.status}
          </div>
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}
