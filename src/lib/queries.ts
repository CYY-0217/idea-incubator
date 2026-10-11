import { desc, eq, sql } from "drizzle-orm";

import { db } from "./db";
import {
  attachments,
  followups,
  ideaSource,
  ideaStatus,
  ideaTags,
  ideaVersions,
  ideas,
  tags,
  versionOrigin,
} from "./db/schema";

export type IdeaStatus = (typeof ideaStatus.enumValues)[number];
export type IdeaSource = (typeof ideaSource.enumValues)[number];
export type VersionOrigin = (typeof versionOrigin.enumValues)[number];
export type Idea = typeof ideas.$inferSelect;
export type IdeaVersion = typeof ideaVersions.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Followup = typeof followups.$inferSelect;

export type IdeaDetail = {
  idea: Idea;
  versions: IdeaVersion[];
  attachments: Attachment[];
  followups: Followup[];
};

export async function createIdea(input: {
  rawText: string;
  source: IdeaSource;
}): Promise<Idea> {
  const [row] = await db
    .insert(ideas)
    .values({ rawText: input.rawText, source: input.source })
    .returning();
  return row;
}

export async function listIdeas(status?: IdeaStatus): Promise<Idea[]> {
  return db
    .select()
    .from(ideas)
    .where(status ? eq(ideas.status, status) : undefined)
    .orderBy(desc(ideas.updatedAt));
}

export async function getIdea(id: number): Promise<IdeaDetail | null> {
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
  if (!idea) return null;

  const [versions, files, questions] = await Promise.all([
    db
      .select()
      .from(ideaVersions)
      .where(eq(ideaVersions.ideaId, id))
      .orderBy(desc(ideaVersions.vNo)),
    db
      .select()
      .from(attachments)
      .where(eq(attachments.ideaId, id))
      .orderBy(desc(attachments.createdAt)),
    db
      .select()
      .from(followups)
      .where(eq(followups.ideaId, id))
      .orderBy(desc(followups.createdAt)),
  ]);

  return { idea, versions, attachments: files, followups: questions };
}

export async function updateStatus(
  id: number,
  status: IdeaStatus,
): Promise<Idea | null> {
  const [row] = await db
    .update(ideas)
    .set({ status, updatedAt: new Date() })
    .where(eq(ideas.id, id))
    .returning();
  return row ?? null;
}

/** 追加版本节点：事务内取 max(v_no)+1，(idea_id, v_no) 唯一索引兜底并发 */
export async function addIdeaVersion(input: {
  ideaId: number;
  payload: Record<string, unknown>;
  origin: VersionOrigin;
}): Promise<IdeaVersion> {
  return db.transaction(async (tx) => {
    const [{ maxVNo }] = await tx
      .select({ maxVNo: sql<number>`coalesce(max(${ideaVersions.vNo}), 0)` })
      .from(ideaVersions)
      .where(eq(ideaVersions.ideaId, input.ideaId));

    const [row] = await tx
      .insert(ideaVersions)
      .values({
        ideaId: input.ideaId,
        vNo: Number(maxVNo) + 1,
        payload: input.payload,
        origin: input.origin,
      })
      .returning();

    await tx
      .update(ideas)
      .set({ updatedAt: new Date() })
      .where(eq(ideas.id, input.ideaId));

    return row;
  });
}

export async function addFollowup(input: {
  ideaId: number;
  question: string;
  answer?: string;
}): Promise<Followup> {
  const [row] = await db
    .insert(followups)
    .values({
      ideaId: input.ideaId,
      question: input.question,
      answer: input.answer ?? null,
    })
    .returning();
  return row;
}

export async function addAttachment(input: {
  ideaId: number;
  filePath: string;
  kind?: string;
}): Promise<Attachment> {
  const [row] = await db
    .insert(attachments)
    .values({
      ideaId: input.ideaId,
      filePath: input.filePath,
      kind: input.kind ?? "screenshot",
    })
    .returning();
  return row;
}

/** 全量替换某想法的标签（set 语义），空数组即清空 */
export async function setTags(
  ideaId: number,
  names: string[],
): Promise<string[]> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  return db.transaction(async (tx) => {
    const tagRows =
      unique.length > 0
        ? await tx
            .insert(tags)
            .values(unique.map((name) => ({ name })))
            .onConflictDoUpdate({
              target: tags.name,
              set: { name: sql`excluded.name` },
            })
            .returning()
        : [];

    await tx.delete(ideaTags).where(eq(ideaTags.ideaId, ideaId));
    if (tagRows.length > 0) {
      await tx
        .insert(ideaTags)
        .values(tagRows.map((t) => ({ ideaId, tagId: t.id })))
        .onConflictDoNothing();
    }
    return tagRows.map((t) => t.name);
  });
}
