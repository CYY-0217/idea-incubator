import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Idea, IdeaSource, IdeaStatus } from "@/lib/queries";
import { timeAgo } from "@/lib/time";

export const STATUS_META: Record<
  IdeaStatus,
  { label: string; accent: string; dot: string }
> = {
  seed: { label: "种子", accent: "border-l-orange-500", dot: "bg-orange-500" },
  shaping: { label: "展开中", accent: "border-l-sky-500", dot: "bg-sky-500" },
  proving: {
    label: "推进中",
    accent: "border-l-emerald-500",
    dot: "bg-emerald-500",
  },
  paused: { label: "搁置", accent: "border-l-stone-400", dot: "bg-stone-400" },
  shipped: {
    label: "落地",
    accent: "border-l-violet-500",
    dot: "bg-violet-500",
  },
};

export const SOURCE_LABEL: Record<IdeaSource, string> = {
  keyword: "关键词",
  text: "想法",
  paste: "对话",
  screenshot: "截图",
};

export function IdeaCard({
  idea,
  index = 0,
  tags = [],
}: {
  idea: Idea;
  index?: number;
  tags?: string[];
}) {
  const status = STATUS_META[idea.status];

  return (
    <Link
      href={`/idea/${idea.id}`}
      className="group block animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Card
        size="sm"
        className={`gap-2 rounded-lg border-l-2 shadow-card transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-card-hover group-active:translate-y-0 ${status.accent}`}
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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-4 pb-1">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}
