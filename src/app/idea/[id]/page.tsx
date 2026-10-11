import Link from "next/link";
import { notFound } from "next/navigation";

import { AttachmentPanel } from "@/components/attachment-panel";
import { FollowupPanel } from "@/components/followup-panel";
import {
  SOURCE_LABEL,
  STATUS_META,
} from "@/components/idea-card";
import { PanelSection } from "@/components/panel-section";
import { StatusSwitcher } from "@/components/status-switcher";
import { TagEditor } from "@/components/tag-editor";
import { VersionTimeline } from "@/components/version-timeline";
import { getIdea, getPanels } from "@/lib/queries";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/70">
      {children}
    </h2>
  );
}

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
  const { idea, attachments, versions, followups, tags } = detail;
  const panels = await getPanels(num);
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
        <p className="whitespace-pre-wrap font-heading text-[15px] leading-relaxed text-foreground/90">
          {idea.rawText}
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <SectionLabel>标签</SectionLabel>
        <TagEditor ideaId={idea.id} initial={tags} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>状态</SectionLabel>
        <StatusSwitcher id={idea.id} current={idea.status} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>演化时间线</SectionLabel>
        <VersionTimeline versions={versions} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>AI 评审团</SectionLabel>
        <PanelSection
          ideaId={idea.id}
          panels={panels.map((p) => {
            const payload = p.payload as {
              reviews?: Array<{ persona: string; verdict: string; comment: string }>;
            };
            return {
              id: p.id,
              reviews: payload.reviews ?? [],
              origin: p.origin,
              at: timeAgo(p.createdAt),
            };
          })}
        />
      </section>

      <section className="flex flex-col gap-3">
        <SectionLabel>AI 追问</SectionLabel>
        <FollowupPanel
          ideaId={idea.id}
          followups={followups.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
          }))}
        />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>附件</SectionLabel>
        <AttachmentPanel
          ideaId={idea.id}
          attachments={attachments.map((a) => ({ id: a.id, filePath: a.filePath }))}
        />
      </section>
    </div>
  );
}
