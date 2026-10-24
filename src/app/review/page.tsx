import Link from "next/link";

import { IdeaCard } from "@/components/idea-card";
import { getWeeklyReview } from "@/lib/queries";
import { STATUS_META } from "@/components/idea-card";

export const dynamic = "force-dynamic";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
      {children}
    </h2>
  );
}

export default async function ReviewPage() {
  const review = await getWeeklyReview();
  const stats = [
    { label: "本周新增", value: review.newThisWeek.length },
    { label: "本周展开", value: review.expandedThisWeek },
    { label: "累计落地", value: review.shippedTotal },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">周回顾</h1>
        <p className="page-sub">
          每周花五分钟看一眼：什么在生长，什么在沉睡，什么其实是同一件事。
        </p>
      </div>

      <div className="flex gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-1 flex-col items-start gap-1 rounded-lg border border-border/60 bg-card p-4 shadow-card"
          >
            <span className="font-mono text-2xl tabular-nums">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <SectionLabel>本周新想法</SectionLabel>
        {review.newThisWeek.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            本周还没有新想法。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {review.newThisWeek.map((idea, i) => (
              <IdeaCard key={idea.id} idea={idea} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>沉睡的想法</SectionLabel>
        {review.stale.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            没有被搁置超过一周的活跃想法，很好。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {review.stale.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <li key={s.id}>
                  <Link
                    href={`/idea/${s.id}`}
                    className="group flex items-center gap-2.5 rounded-lg border border-border/60 bg-card p-3 text-sm shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                  >
                    <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} />
                    <span className="line-clamp-1 text-foreground/90">{s.rawText}</span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground/70">
                      沉睡 {s.silentDays} 天
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>这两个可能是一件事</SectionLabel>
        {review.pairs.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            暂未发现相似的活跃想法。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {review.pairs.map((pair, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center"
              >
                <Link
                  href={`/idea/${pair.a.id}`}
                  className="line-clamp-1 flex-1 text-sm text-foreground/90 underline-offset-2 hover:underline"
                >
                  {pair.a.rawText}
                </Link>
                <span className="font-mono text-[10px] uppercase tracking-widest text-primary/80">
                  ≈ {Math.round(pair.score * 100)}%
                </span>
                <Link
                  href={`/idea/${pair.b.id}`}
                  className="line-clamp-1 flex-1 text-sm text-foreground/90 underline-offset-2 hover:underline"
                >
                  {pair.b.rawText}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
