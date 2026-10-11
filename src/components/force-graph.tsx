"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { GraphData } from "@/lib/queries";

const STATUS_FILL: Record<string, string> = {
  seed: "#f59e0b",
  shaping: "#0ea5e9",
  proving: "#14b8a6",
  paused: "#a8a29e",
  shipped: "#8b5cf6",
};

type Node = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fill: string;
  title: string;
};

const W = 960;
const H = 560;

export function ForceGraph({ data }: { data: GraphData }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const [tick, setTick] = useState(0);
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);

  useEffect(() => {
    // 初始：圆环摆放，避免重叠
    const n = data.nodes.length;
    nodesRef.current = data.nodes.map((node, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2;
      return {
        id: node.id,
        x: W / 2 + Math.cos(angle) * Math.min(W, H) * 0.32,
        y: H / 2 + Math.sin(angle) * Math.min(W, H) * 0.32,
        vx: 0,
        vy: 0,
        r: 12 + Math.min(node.versionCount, 6) * 2,
        fill: STATUS_FILL[node.status] ?? "#a8a29e",
        title: node.title,
      };
    });

    // 力导向模拟：斥力 + 弹簧 + 向心，400 步收敛
    const nodeById = new Map(nodesRef.current.map((nd) => [nd.id, nd]));
    for (let step = 0; step < 400; step++) {
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const a = nodesRef.current[i];
          const b = nodesRef.current[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          let dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = ((180 - dist) / dist) * 0.06;
            dx /= dist;
            dy /= dist;
            a.vx -= dx * force * dist;
            a.vy -= dy * force * dist;
            b.vx += dx * force * dist;
            b.vy += dy * force * dist;
          }
        }
      }
      for (const edge of data.edges) {
        const a = nodeById.get(edge.a);
        const b = nodeById.get(edge.b);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = ((dist - 150) / dist) * 0.04;
        a.vx += (dx / dist) * force * dist;
        a.vy += (dy / dist) * force * dist;
        b.vx -= (dx / dist) * force * dist;
        b.vy -= (dy / dist) * force * dist;
      }
      for (const nd of nodesRef.current) {
        nd.vx += (W / 2 - nd.x) * 0.003;
        nd.vy += (H / 2 - nd.y) * 0.003;
        nd.vx *= 0.85;
        nd.vy *= 0.85;
        nd.x = Math.max(40, Math.min(W - 40, nd.x + nd.vx));
        nd.y = Math.max(36, Math.min(H - 36, nd.y + nd.vy));
      }
    }
    setTick((t) => t + 1);
  }, [data]);

  function pointerDown(e: React.PointerEvent<SVGGElement>, id: number) {
    dragRef.current = { id, moved: false };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function pointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nd = nodesRef.current.find((x) => x.id === drag.id);
    if (!nd) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (Math.abs(x - nd.x) + Math.abs(y - nd.y) > 2) drag.moved = true;
    nd.x = Math.max(40, Math.min(W - 40, x));
    nd.y = Math.max(36, Math.min(H - 36, y));
    setTick((t) => t + 1);
  }

  function pointerUp(id: number) {
    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && !drag.moved) router.push(`/idea/${id}`);
  }

  if (data.nodes.length === 0) {
    return (
      <p className="py-16 text-sm text-muted-foreground">
        还没有想法。先回收件箱扔一条进来。
      </p>
    );
  }

  const nodeById = new Map(nodesRef.current.map((nd) => [nd.id, nd]));

  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/70 shadow-card backdrop-blur-sm">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[560px] w-full min-w-[720px] touch-none select-none"
        onPointerMove={pointerMove}
      >
        {data.edges.map((edge, i) => {
          const a = nodeById.get(edge.a);
          const b = nodeById.get(edge.b);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--primary)"
              strokeWidth={1 + edge.score * 3}
              opacity={0.15 + edge.score * 0.6}
            />
          );
        })}
        {nodesRef.current.map((nd) => (
          <g
            key={nd.id}
            transform={`translate(${nd.x} ${nd.y})`}
            className="cursor-pointer"
            onPointerDown={(e) => pointerDown(e, nd.id)}
            onPointerUp={() => pointerUp(nd.id)}
          >
            <circle r={nd.r + 6} fill={nd.fill} opacity={0.15} />
            <circle r={nd.r} fill={nd.fill} opacity={0.9} />
            <text
              y={nd.r + 14}
              textAnchor="middle"
              fontSize={10}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {nd.title.length > 12 ? `${nd.title.slice(0, 12)}…` : nd.title}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
