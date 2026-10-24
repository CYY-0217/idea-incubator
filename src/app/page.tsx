import Link from "next/link";

import { GrowthIllustration, SeedlingMark } from "@/components/growth-illustration";
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

type StatKind = "inbox" | "week" | "expand" | "shipped";

function StatIcon({ kind }: { kind: StatKind }) {
  const common = {
    viewBox: "0 0 24 24",
    className: "size-3.5",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "inbox":
      return (
        <svg {...common}>
          <path d="M4 5.5h16v13H4z" />
          <path d="M4 13.5h4l2 3h4l2-3h4" />
        </svg>
      );
    case "week":
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="14" rx="2" />
          <path d="M8 3.5v4M16 3.5v4M4 10.5h16" />
        </svg>
      );
    case "expand":
      return (
        <svg {...common}>
          <path d="M12 3.5l8 4.5-8 4.5-8-4.5z" />
          <path d="M4 13l8 4.5 8-4.5" />
        </svg>
      );
    case "shipped":
      return (
        <svg {...common}>
          <path d="M6 21V4" />
          <path d="M6 4.5h11l-2.2 3.4L17 11.5H6" />
        </svg>
      );
  }
}

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
    <div className="mx-auto max-w-5xl px-6 py-8 sm:py-12">
      {/* Hero：问候 + 水彩生长插画 */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/65 px-5 py-7 shadow-card backdrop-blur-sm animate-in fade-in duration-500 sm:px-8 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-emerald-200/35 blur-3xl"
        />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-center lg:gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="eyebrow">Idea incubator</span>
              <span className="h-px w-7 bg-border" />
              <span className="font-mono text-[11px] tracking-widest text-muted-foreground/70">
                {todayLabel()}
              </span>
            </div>

            <h1 className="page-title max-w-[26ch] text-balance">
              {greeting()}。
              <span className="mt-1.5 block text-primary">
                今天有什么模糊的念头？
              </span>
            </h1>

            <p className="page-sub max-w-md">
              先扔进来就好，不必成形。想清楚的部分慢慢写进档案，再陪你从一颗种子，养成能落地的东西。
            </p>
          </div>

          <div className="mx-auto w-full max-w-[300px] sm:max-w-[340px] lg:mx-0 lg:max-w-none">
            <GrowthIllustration className="h-auto w-full drop-shadow-[0_18px_30px_rgba(47,139,124,0.12)]" />
            <div className="mt-1 flex items-center justify-center gap-3 font-mono text-[10px] tracking-[0.22em] text-muted-foreground/60">
              <span>种子</span>
              <span className="h-px w-5 bg-border" />
              <span>嫩芽</span>
              <span className="h-px w-5 bg-border" />
              <span>长成</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <IdeaInput />
      </div>

      {/* 空库引导 */}
      {isEmpty ? (
        <section className="relative mt-8 overflow-hidden rounded-2xl border border-border/60 bg-card/55 px-5 py-7 shadow-card backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500 sm:px-8 sm:py-9">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-center">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="eyebrow">三步开始</span>
                <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                  先把一颗种子放进来
                </h2>
                <p className="page-sub max-w-lg">
                  收件箱现在是空的。不用想清楚，任何一句没头没尾的话都可以是起点。
                </p>
              </div>

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
                    desc: "把想清楚的部分写成九字段档案：产出路线、差异点、今晚就能做的第一步",
                  },
                  {
                    no: "03",
                    title: "养成",
                    desc: "每周回顾：追问、回流、看它从种子长成能落地的东西",
                  },
                ].map((s, i) => (
                  <div
                    key={s.no}
                    className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-card/80 p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:backwards]"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span
                      aria-hidden
                      className="absolute -right-3 -top-4 font-mono text-4xl text-primary/10 transition-colors group-hover:text-primary/15"
                    >
                      {s.no}
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.2em] text-primary">
                      {s.no}
                    </span>
                    <span className="font-heading text-lg">{s.title}</span>
                    <span className="text-xs leading-relaxed text-muted-foreground">
                      {s.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-[190px] lg:max-w-none">
              <SeedlingMark className="h-auto w-full" />
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* 苗圃概览：数字 + 生长阶段 */}
          <section className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="section-title">苗圃概览</h2>
              <span className="section-note">
                {overview.total} 颗想法在生长
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  { kind: "inbox", value: overview.total, label: "入箱" },
                  { kind: "week", value: overview.newThisWeek, label: "本周新增" },
                  { kind: "expand", value: overview.expandedTotal, label: "展开次数" },
                  { kind: "shipped", value: overview.statusCounts.shipped, label: "落地" },
                ] as Array<{ kind: StatKind; value: number; label: string }>
              ).map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-4 shadow-card backdrop-blur-sm transition-shadow duration-200 hover:shadow-card-hover"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="eyebrow">{s.label}</span>
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <StatIcon kind={s.kind} />
                    </span>
                  </div>
                  <span className="font-mono text-2xl leading-none tabular-nums text-foreground">
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 状态分布条 */}
            <div className="mt-3 rounded-xl border border-border/60 bg-card/55 px-4 py-4 shadow-card backdrop-blur-sm">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="section-title section-title-sm">生长阶段</h3>
                <span className="section-note">
                  共 {totalForBar}
                </span>
              </div>
              <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted">
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
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
                {(Object.entries(overview.statusCounts) as Array<[IdeaStatus, number]>).map(
                  ([s, n]) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className={`size-1.5 rounded-full ${STATUS_META[s].dot}`} />
                      {STATUS_META[s].label}
                      <span className="font-mono text-muted-foreground/60">{n}</span>
                    </span>
                  ),
                )}
              </div>
            </div>
          </section>

          {/* 主列 + 动态侧栏 */}
          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_268px]">
            <div className="flex min-w-0 flex-col gap-5">
              <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="section-title section-title-sm">收件箱</h2>
                    <span className="section-note">
                      {ideas.length} 条
                    </span>
                  </div>
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
                </div>

                {allTags.length > 0 && (
                  <nav
                    className="flex flex-wrap items-center gap-1.5 border-t border-dashed border-border/50 pt-3"
                    aria-label="标签筛选"
                  >
                    <span className="mr-0.5 font-mono text-[10px] tracking-widest text-muted-foreground/50">
                      标签
                    </span>
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
              </div>

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
                <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border/70 bg-card/40 px-5 py-14">
                  <p className="text-sm text-muted-foreground">
                    这个筛选下没有想法。
                  </p>
                  <Link
                    href="/"
                    className="font-mono text-[11px] text-primary underline-offset-2 hover:underline"
                  >
                    清除筛选
                  </Link>
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
              <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20">
                <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-card backdrop-blur-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="section-title section-title-sm">最近动态</h2>
                    <span className="font-mono text-[10px] text-muted-foreground/50">
                      {overview.recentEvents.length}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-col">
                    {overview.recentEvents.map((e, i) => (
                      <li
                        key={`${e.kind}-${e.ideaId}-${i}`}
                        className="flex items-start gap-2.5 border-b border-dashed border-border/50 py-2.5 last:border-0 last:pb-0 first:pt-0 animate-in fade-in slide-in-from-left-2 duration-500 [animation-fill-mode:backwards]"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${EVENT_DOT[e.kind]}`}
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link
                            href={`/idea/${e.ideaId}`}
                            className="line-clamp-1 text-xs text-foreground/85 underline-offset-2 hover:underline"
                          >
                            {e.ideaTitle}
                          </Link>
                          <span className="text-[11px] leading-relaxed text-muted-foreground">
                            {e.label} · {timeAgo(e.at)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="px-1 font-mono text-[10px] leading-relaxed tracking-widest text-muted-foreground/45">
                  SEED · SHAPE · PROVE · SHIP
                </p>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}
