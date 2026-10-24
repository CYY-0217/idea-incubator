import Link from "next/link";

import { ForceGraph } from "@/components/force-graph";
import { STATUS_META } from "@/components/idea-card";
import { getGraph } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const graph = await getGraph();
  const edgeCount = graph.edges.length;
  const manualCount = graph.edges.filter((e) => e.kind === "manual").length;
  const similarCount = edgeCount - manualCount;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">想法图谱</h1>
        <p className="page-sub">
          圆点是想法。虚线是文本相似度，实线是你亲手连的关系——拖动节点整理位置，切到「连线」模式把两个点连起来。
        </p>
      </div>

      <ForceGraph data={graph} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {Object.entries(STATUS_META).map(([s, meta]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden>
            <line x1="0" y1="3" x2="22" y2="3" stroke="var(--primary)" strokeWidth="2.4" opacity="0.55" />
          </svg>
          手动 {manualCount}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="6" aria-hidden>
            <line x1="0" y1="3" x2="22" y2="3" stroke="var(--primary)" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.5" />
          </svg>
          相似 {similarCount}
        </span>
        <span className="ml-auto font-mono">
          {graph.nodes.length} 节点 · {edgeCount} 条边
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        找到靠得特别近的一对？去{" "}
        <Link href="/review" className="underline underline-offset-2 hover:text-foreground">
          周回顾
        </Link>{" "}
        看系统建议。
      </p>
    </div>
  );
}
