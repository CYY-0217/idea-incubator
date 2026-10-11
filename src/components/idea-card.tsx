import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Idea, IdeaSource, IdeaStatus } from "@/lib/queries";
import { timeAgo } from "@/lib/time";

export const STATUS_META: Record<
  IdeaStatus,
  { label: string; accent: string; dot: string }
> = {
  seed: { label: "种子", accent: "border-l-amber-400/80", dot: "bg-amber-400" },
  shaping: {
    label: "展开中",
    accent: "border-l-sky-400/70",
    dot: "bg-sky-400",
  },
  proving: {
    label: "推进中",
    accent: "border-l-emerald-400/70",
    dot: "bg-emerald-400",
  },
  paused: { label: "搁置", accent: "border-l-zinc-500/70", dot: "bg-zinc-500" },
  shipped: {
    label: "落地",
    accent: "border-l-violet-400/70",
    dot: "bg-violet-400",
  },
};

export const SOURCE_LABEL: Record<IdeaSource, string> = {
  keyword: "关键词",
  text: "想法",
  paste: "对话",
  screenshot: "截图",
};

export function IdeaCard({ idea }: { idea: Idea }) {
  const status = STATUS_META[idea.status];

  return (
    <Link href={`/idea/${idea.id}`} className="group block">
      <Card
        size="sm"
        className={`gap-2 rounded-lg border-l-2 transition-colors group-hover:ring-primary/40 ${status.accent}`}
      >
        <div className="flex items-center gap-2 px-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <Badge
            variant="outline"
            className="rounded-md px-1.5 text-[11px] font-normal text-muted-foreground"
          >
            {SOURCE_LABEL[idea.source]}
          </Badge>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
            {timeAgo(idea.updatedAt)}
          </span>
        </div>
        <p className="line-clamp-2 px-4 text-sm leading-relaxed text-foreground/90">
          {idea.rawText}
        </p>
      </Card>
    </Link>
  );
}
