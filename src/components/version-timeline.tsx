import { Badge } from "@/components/ui/badge";
import type { IdeaVersion } from "@/lib/queries";
import { timeAgo } from "@/lib/time";

const FIELDS: Array<{ key: string; label: string }> = [
  { key: "restated", label: "一句话重述" },
  { key: "problem", label: "问题 · 用户 · 场景" },
  { key: "output_form", label: "产出形式与路线" },
  { key: "alternatives", label: "现有类似物" },
  { key: "edge", label: "差异点" },
  { key: "first_step", label: "最小第一步" },
];

const ORIGIN_LABEL: Record<string, string> = {
  zcode: "ZCode",
  deepseek: "DeepSeek",
  manual: "手动",
};

export function VersionTimeline({ versions }: { versions: IdeaVersion[] }) {
  if (versions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground/60">
        还没有展开记录。跑一次展开，让它长出第一版。
      </p>
    );
  }

  const sorted = [...versions].sort((a, b) => b.vNo - a.vNo);

  return (
    <ol className="relative flex flex-col gap-5 border-l border-border/70 pl-5">
      {sorted.map((v, i) => {
        const p = (v.payload ?? {}) as Record<string, unknown>;
        return (
          <li
            key={v.id}
            className="relative animate-in fade-in slide-in-from-left-2 duration-500 [animation-fill-mode:backwards]"
            style={{ animationDelay: `${Math.min(i, 6) * 80}ms` }}
          >
            <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-primary ring-4 ring-primary/15" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-[11px] font-medium text-foreground/80">
                v{v.vNo}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                {ORIGIN_LABEL[v.origin] ?? v.origin}
              </span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
                {timeAgo(v.createdAt)}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-2.5 rounded-xl border border-border/60 bg-card/85 p-3.5 shadow-card backdrop-blur-sm">
              {FIELDS.map((f) =>
                typeof p[f.key] === "string" && p[f.key] ? (
                  <div key={f.key} className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-muted-foreground/70">
                      {f.label}
                    </span>
                    <span className="text-sm leading-relaxed text-foreground/90">
                      {p[f.key] as string}
                    </span>
                  </div>
                ) : null,
              )}
              {(p.novelty != null || p.feasibility != null) && (
                <div className="flex items-center gap-1.5">
                  {p.novelty != null && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-transparent bg-primary/10 px-2 font-mono text-[11px] font-normal text-primary"
                    >
                      新颖性 {String(p.novelty)}/5
                    </Badge>
                  )}
                  {p.feasibility != null && (
                    <Badge
                      variant="outline"
                      className="rounded-full border-transparent bg-sky-500/10 px-2 font-mono text-[11px] font-normal text-sky-600"
                    >
                      可行性 {String(p.feasibility)}/5
                    </Badge>
                  )}
                </div>
              )}
              {typeof p.risk === "string" && p.risk ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  风险：{p.risk}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
