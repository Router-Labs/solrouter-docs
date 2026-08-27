'use client';

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FlowCanvas } from './flow-canvas';
import type { BoxNode, FlowEdge, FlowStep } from './data/types';

export type FlowFigureProps = {
  /* One sentence that describes the whole diagram. */
  ariaLabel: string;
  nodes: BoxNode[];
  edges: FlowEdge[];
  width?: number;
  height?: number;
  /* When given, a step list drives the active node and edge. Never auto-plays. */
  steps?: FlowStep[];
};

const NO_MOTION = { duration: 0 };

function clamp(i: number, max: number): number {
  return Math.max(0, Math.min(max, i));
}

/* MDX wrapper: canvas, aria-live detail panel, optional step list. */
export function FlowFigure({
  ariaLabel,
  nodes,
  edges,
  width = 880,
  height = 480,
  steps,
}: FlowFigureProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const step = steps?.[stepIndex];

  const viewNodes = useMemo(
    () =>
      step
        ? nodes.map((n) =>
            n.id === step.nodeId ? { ...n, data: { ...n.data, active: true } } : n,
          )
        : nodes,
    [nodes, step],
  );

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : undefined;

  const goTo = useCallback(
    (i: number) => {
      if (!steps || steps.length === 0) return;
      const next = clamp(i, steps.length - 1);
      setStepIndex(next);
      setSelectedId(steps[next].nodeId);
      listRef.current?.querySelectorAll('button')[next]?.focus();
    },
    [steps],
  );

  const onListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLOListElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(stepIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(stepIndex - 1);
      }
    },
    [goTo, stepIndex],
  );

  return (
    <figure
      aria-label={ariaLabel}
      className="my-6 rounded-2xl border border-fd-border bg-fd-card/40 p-3"
    >
      {/* role="img" sits on the canvas only, so the buttons and the panel below stay in the accessibility tree. */}
      <div
        role="img"
        aria-label={ariaLabel}
        className={`h-[420px] w-full md:h-[480px] ${reducedMotion ? 'flow-reduced-motion' : ''}`}
      >
        <FlowCanvas
          nodes={viewNodes}
          edges={edges}
          width={width}
          height={height}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeEdgeId={step?.edgeId ?? null}
          fitViewOptions={reducedMotion ? NO_MOTION : undefined}
        />
      </div>

      <div aria-live="polite" className="mt-3 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl border border-fd-border bg-fd-card p-3">
          {selected ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="font-medium">Node</dt>
              <dd>{selected.data.title}</dd>
              <dt className="font-medium">Holds</dt>
              <dd>{selected.data.detail.holds}</dd>
              <dt className="font-medium">Sees</dt>
              <dd>{selected.data.detail.sees}</dd>
              {selected.data.detail.status ? (
                <>
                  <dt className="font-medium">Status</dt>
                  <dd>{selected.data.detail.status}</dd>
                </>
              ) : null}
              {selected.data.detail.href ? (
                <>
                  <dt className="font-medium">Deep dive</dt>
                  <dd>
                    <a href={selected.data.detail.href}>Open page →</a>
                  </dd>
                </>
              ) : null}
            </dl>
          ) : (
            <p className="text-fd-muted-foreground">
              Select a node to see what it holds and what it sees.
            </p>
          )}
        </div>

        {step ? (
          <div className="rounded-xl border border-fd-border bg-fd-card p-3">
            <div className="font-medium">
              Step {stepIndex + 1} of {steps?.length}: {step.label}
            </div>
            <code className="mt-1 block text-xs whitespace-pre-wrap">{step.payload}</code>
          </div>
        ) : null}
      </div>

      {steps && steps.length > 0 ? (
        <ol
          ref={listRef}
          aria-label="Steps. Use the left and right arrow keys to move."
          className="mt-3 flex flex-wrap gap-2"
          onKeyDown={onListKeyDown}
        >
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                aria-pressed={i === stepIndex}
                onClick={() => goTo(i)}
                className={`rounded-lg border px-2 py-1 text-xs ${
                  i === stepIndex
                    ? 'border-fd-primary bg-fd-primary/15 text-fd-primary'
                    : 'border-fd-border bg-fd-card text-fd-muted-foreground'
                }`}
              >
                {i + 1}. {s.label}
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </figure>
  );
}
