import Link from "next/link";

import { IdeaCard } from "@/components/idea-card";
import { IdeaInput } from "@/components/idea-input";
import {
  STATUS_META,
} from "@/components/idea-card";
import {
  getAllTags,
  getHomeOverview,
  listIdeas,
  tagsForIdeas,
  versionCountsForIdeas,
  type IdeaStatus,
} from "@/lib/queries";
import { timeAgo } from "@/lib/time";

// 每次请求实时拉库，收件箱不做静态化
export const dynamic = "force-dynamic";

const FILTERS: Array<{ value: IdeaStatus | "all"; label: string }> = [
  { value: "all", label: "全部" },
  { value: "seed", label: "种子" },
  { value: "shaping", label: "展开中" },
  { value: "proving", label: "推进中" },
  { value: "paused", label: "搁置" },
  { value: "shipped", label: "落地" },
];

const EVENT_DOT: Record<string, string> = {
  created: "bg-orange-500",
  version: "bg-sky-500",
  followup: "bg-emerald-500",
};

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function todayLabel(): string {
  const now = new Date();
  return `${now.getMonth() + 1}月${now.getDate()}日 · 周${"日一二三四五六"[now.getDay()]}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tag?: string }>;
}) {
  const { status, tag } = await searchParams;
  const active: IdeaStatus | "all" = FILTERS.some((f) => f.value === status)
    ? (status as IdeaStatus | "all")
    : "all";
  const activeTag = tag?.trim() || undefined;

  const overview = await getHomeOverview();
  const ideas = await listIdeas(
    active === "all" ? undefined : active,
    activeTag,
  );
  const allTags = await getAllTags();
  const tagMap = await tagsForIdeas(ideas.map((i) => i.id));
  const versionMap = await versionCountsForIdeas(ideas.map((i) => i.id));
  const isEmpty = overview.total === 0;

  const totalForBar = Object.values(overview.statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* 问候区 */}
      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="page-title">
          {greeting()}。今天有什么模糊的念头？
        </h1>
        <p className="font-mono text-[11px] tracking-widest text-muted-foreground/70">
          {todayLabel()}
        </p>
      </div>

      <IdeaInput />

      {/* 空库引导 */}
      {isEmpty ? (
        <div className="mt-12 flex flex-col gap-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
            三步开始
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                no: "01",
                title: "扔",
                desc: "一个关键词、一段对话、一张截图——别管成形不成形，扔进来就好",
              },
              {
                no: "02",
                title: "展开",
                desc: "AI 把它变成九字段档案：产出路线、差异点、今晚就能做的第一步",
              },
              {
                no: "03",
                title: "养成",
                desc: "每周回顾：追问、回流、看它从种子长成能落地的东西",
              },
            ].map((s, i) => (
              <div
                key={s.no}
                className="flex flex-col gap-2 rounded-lg border border-border/60 bg-card p-4 shadow-card animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="font-mono text-xs text-primary">{s.no}</span>
                <span className="font-heading text-lg">{s.title}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {s.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 数字概览 */}
          <div className="mt-8 flex items-baseline gap-8 border-y border-border/60 py-4">
            {[
              { value: overview.total, label: "入箱" },
              { value: overview.newThisWeek, label: "本周新增" },
              { value: overview.expandedTotal, label: "展开次数" },
              { value: overview.statusCounts.shipped, label: "落地" },
            ].map((s) => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>

          {/* 状态分布条 */}
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
              {(Object.entries(overview.statusCounts) as Array<[IdeaStatus, number]>).map(
                ([s, n]) =>
                  n > 0 ? (
                    <div
                      key={s}
                      className={`${STATUS_META[s].dot} transition-all duration-500`}
                      style={{ width: `${Math.max((n / totalForBar) * 100, 3)}%` }}
                      title={`${STATUS_META[s].label} ${n}`}
                    />
                  ) : null,
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {(Object.entries(overview.statusCounts) as Array<[IdeaStatus, number]>).map(
                ([s, n]) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={`size-1.5 rounded-full ${STATUS_META[s].dot}`} />
                    {STATUS_META[s].label} {n}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* 主列 + 动态侧栏 */}
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="flex flex-col gap-5">
              <nav className="flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => {
                  const isActive = f.value === active && !activeTag;
                  return (
                    <Link
                      key={f.value}
                      href={f.value === "all" ? "/" : `/?status=${f.value}`}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-all duration-150 active:scale-95 ${
                        isActive
                          ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                          : "border-border/70 text-muted-foreground hover:-translate-y-px hover:border-border hover:bg-card hover:text-foreground hover:shadow-sm"
                      }`}
                    >
                      {f.label}
                    </Link>
                  );
                })}
              </nav>

              {allTags.length > 0 && (
                <nav
                  className="flex flex-wrap items-center gap-1.5"
                  aria-label="标签筛选"
                >
                  {allTags.map((t) => {
                    const isActive = activeTag === t.name;
                    return (
                      <Link
                        key={t.name}
                        href={
                          isActive ? "/" : `/?tag=${encodeURIComponent(t.name)}`
                        }
                        className={`flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[11px] transition-all duration-150 active:scale-95 ${
                          isActive
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border/70 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                        }`}
                      >
                        {t.name}
                        <span className="font-mono text-[10px] opacity-60">
                          {t.count}
                        </span>
                      </Link>
                    );
                  })}
                </nav>
              )}

              {activeTag && (
                <p className="text-xs text-muted-foreground">
                  按「{activeTag}」筛选 ·{" "}
                  <Link
                    href="/"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    清除
                  </Link>
                </p>
              )}

              {ideas.length === 0 ? (
                <div className="flex flex-col items-start gap-2 py-16">
                  <p className="text-sm text-muted-foreground">
                    这个筛选下没有想法。
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {ideas.map((idea, i) => (
                    <IdeaCard
                      key={idea.id}
                      idea={idea}
                      index={i}
                      tags={tagMap.get(idea.id) ?? []}
                      versionCount={versionMap.get(idea.id) ?? 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 最近动态 */}
            {overview.recentEvents.length > 0 && (
              <aside className="flex flex-col gap-3 lg:sticky lg:top-20">
                <h2 className="eyebrow">
                  最近动态
                </h2>
                <ul className="flex flex-col gap-3">
                  {overview.recentEvents.map((e, i) => (
                    <li
                      key={`${e.kind}-${e.ideaId}-${i}`}
                      className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-500 [animation-fill-mode:backwards]"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${EVENT_DOT[e.kind]}`}
                      />
                      <div className="flex min-w-0 flex-col">
                        <Link
                          href={`/idea/${e.ideaId}`}
                          className="line-clamp-1 text-xs text-foreground/85 underline-offset-2 hover:underline"
                        >
                          {e.ideaTitle}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {e.label} · {timeAgo(e.at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
