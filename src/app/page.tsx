import Link from "next/link";

import { IdeaCard } from "@/components/idea-card";
import { IdeaInput } from "@/components/idea-input";
import { getAllTags, listIdeas, tagsForIdeas, type IdeaStatus } from "@/lib/queries";

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

  const ideas = await listIdeas(
    active === "all" ? undefined : active,
    activeTag,
  );
  const allTags = await getAllTags();
  const tagMap = await tagsForIdeas(ideas.map((i) => i.id));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-10">
      <IdeaInput />

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
        <nav className="flex flex-wrap items-center gap-1.5" aria-label="标签筛选">
          {allTags.map((t) => {
            const isActive = activeTag === t.name;
            return (
              <Link
                key={t.name}
                href={isActive ? "/" : `/?tag=${encodeURIComponent(t.name)}`}
                className={`flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[11px] transition-all duration-150 active:scale-95 ${
                  isActive
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                }`}
              >
                {t.name}
                <span className="font-mono text-[10px] opacity-60">{t.count}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {activeTag && (
        <p className="text-xs text-muted-foreground">
          按「{activeTag}」筛选 ·{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-foreground">
            清除
          </Link>
        </p>
      )}

      {ideas.length === 0 ? (
        <div className="flex flex-col items-start gap-2 py-16">
          <p className="font-heading text-xl">这里还是空的。</p>
          <p className="text-sm text-muted-foreground">
            在上面扔下第一条想法就好。
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
