"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { addLinkAction, removeLinkAction } from "@/app/actions";
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
const keyOf = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

export function ForceGraph({ data }: { data: GraphData }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const [, setTick] = useState(0);
  const [mode, setMode] = useState<"move" | "link">("move");
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(
    null,
  );
  const [manual, setManual] = useState<string[]>(() =>
    data.edges.filter((e) => e.kind === "manual").map((e) => keyOf(e.a, e.b)),
  );
  const dragRef = useRef<{ id: number; moved: boolean } | null>(null);
  const linkFromRef = useRef<number | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setManual(data.edges.filter((e) => e.kind === "manual").map((e) => keyOf(e.a, e.b)));
  }, [data]);

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

  function toWorld(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }

  function findNodeAt(x: number, y: number, pad = 12) {
    return nodesRef.current.find(
      (nd) => Math.hypot(nd.x - x, nd.y - y) <= nd.r + pad,
    );
  }

  function pointerDown(e: React.PointerEvent<SVGGElement>, id: number) {
    svgRef.current?.setPointerCapture(e.pointerId);
    if (mode === "link") {
      const nd = nodesRef.current.find((x) => x.id === id);
      linkFromRef.current = id;
      if (nd) setPreview({ x1: nd.x, y1: nd.y, x2: nd.x, y2: nd.y });
      return;
    }
    dragRef.current = { id, moved: false };
  }

  function pointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const p = toWorld(e);
    if (!p) return;

    if (linkFromRef.current !== null) {
      setPreview((prev) => (prev ? { ...prev, x2: p.x, y2: p.y } : prev));
      const hit = findNodeAt(p.x, p.y);
      setHoverId(hit ? hit.id : null);
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const nd = nodesRef.current.find((x) => x.id === drag.id);
    if (!nd) return;
    if (Math.abs(p.x - nd.x) + Math.abs(p.y - nd.y) > 2) drag.moved = true;
    nd.x = Math.max(40, Math.min(W - 40, p.x));
    nd.y = Math.max(36, Math.min(H - 36, p.y));
    setTick((t) => t + 1);
  }

  function pointerUp(e: React.PointerEvent<SVGSVGElement>) {
    const p = toWorld(e);

    if (linkFromRef.current !== null) {
      const from = linkFromRef.current;
      linkFromRef.current = null;
      setPreview(null);
      setHoverId(null);
      const target = p ? findNodeAt(p.x, p.y) : undefined;
      if (!target || target.id === from) return;
      const key = keyOf(from, target.id);
      setManual((prev) => (prev.includes(key) ? prev : [...prev, key]));
      startTransition(async () => {
        const res = await addLinkAction({ fromId: from, toId: target.id });
        if (!res.ok) {
          toast.error(res.error);
          setManual((prev) => prev.filter((k) => k !== key));
        } else {
          toast.success("已连线");
        }
      });
      return;
    }

    const drag = dragRef.current;
    dragRef.current = null;
    if (drag && !drag.moved) router.push(`/idea/${drag.id}`);
  }

  function deleteManualLink(a: number, b: number) {
    const key = keyOf(a, b);
    setManual((prev) => prev.filter((k) => k !== key));
    startTransition(async () => {
      const res = await removeLinkAction({ a, b });
      if (!res.ok) {
        toast.error(res.error);
        setManual((prev) => (prev.includes(key) ? prev : [...prev, key]));
      } else {
        toast.success("已删除连线");
      }
    });
  }

  if (data.nodes.length === 0) {
    return (
      <p className="py-16 text-base text-muted-foreground">
        还没有想法。先回收件箱扔一条进来。
      </p>
    );
  }

  const nodeById = new Map(nodesRef.current.map((nd) => [nd.id, nd]));
  const similarEdges = data.edges.filter((e) => e.kind === "similar");

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="flex gap-1 rounded-lg border border-border bg-background/60 p-1">
          {(
            [
              { id: "move", label: "移动" },
              { id: "link", label: "连线" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                mode === m.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "link"
            ? "从一个圆点拖到另一个圆点建立关系；点实线可删除"
            : "拖动节点整理位置；点圆点打开详情"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-[560px] w-full min-w-[720px] touch-none select-none"
          style={{ cursor: mode === "link" ? "crosshair" : "default" }}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
        >
          {/* 相似度：虚线 */}
          {similarEdges.map((edge, i) => {
            const a = nodeById.get(edge.a);
            const b = nodeById.get(edge.b);
            if (!a || !b) return null;
            return (
              <line
                key={`s-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--primary)"
                strokeWidth={1 + edge.score * 2.5}
                strokeDasharray="4 5"
                opacity={0.15 + edge.score * 0.5}
              />
            );
          })}

          {/* 手动连线：实线，可点击删除 */}
          {manual.map((key) => {
            const [aId, bId] = key.split("-").map(Number);
            const a = nodeById.get(aId);
            const b = nodeById.get(bId);
            if (!a || !b) return null;
            return (
              <g key={`m-${key}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--primary)"
                  strokeWidth={2.4}
                  opacity={0.55}
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth={12}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteManualLink(aId, bId);
                  }}
                >
                  <title>点击删除这条连线</title>
                </line>
              </g>
            );
          })}

          {/* 连线预览 */}
          {preview && (
            <line
              x1={preview.x1}
              y1={preview.y1}
              x2={preview.x2}
              y2={preview.y2}
              stroke="var(--primary)"
              strokeWidth={1.6}
              strokeDasharray="5 4"
              opacity={0.7}
            />
          )}

          {nodesRef.current.map((nd) => (
            <g
              key={nd.id}
              transform={`translate(${nd.x} ${nd.y})`}
              style={{ cursor: mode === "link" ? "crosshair" : "pointer" }}
              onPointerDown={(e) => pointerDown(e, nd.id)}
            >
              {mode === "link" && hoverId === nd.id && (
                <circle r={nd.r + 9} fill="none" stroke="var(--primary)" strokeWidth={2} />
              )}
              <circle r={nd.r + 6} fill={nd.fill} opacity={0.15} />
              <circle r={nd.r} fill={nd.fill} opacity={0.9} />
              <text
                y={nd.r + 14}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
                className="text-muted-foreground"
              >
                {nd.title.length > 12 ? `${nd.title.slice(0, 12)}…` : nd.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
