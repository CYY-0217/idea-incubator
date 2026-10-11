import Link from "next/link";
import { notFound } from "next/navigation";

import {
  SOURCE_LABEL,
  STATUS_META,
} from "@/components/idea-card";
import { getIdea } from "@/lib/queries";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) notFound();

  const detail = await getIdea(num);
  if (!detail) notFound();
  const { idea, attachments } = detail;
  const status = STATUS_META[idea.status];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <Link
        href="/"
        className="w-fit text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← 收件箱
      </Link>

      <header className={`flex flex-col gap-3 border-l-2 pl-4 ${status.accent}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span>{SOURCE_LABEL[idea.source]}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{timeAgo(idea.createdAt)}</span>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground/70">
            #{idea.id}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {idea.rawText}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
          附件
        </h2>
        {attachments.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            暂无。截图上传明晚接上。
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {attachments.map((a) => (
              <li key={a.id} className="font-mono text-xs text-muted-foreground">
                {a.filePath}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
