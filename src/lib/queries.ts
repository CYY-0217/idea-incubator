import { desc, eq } from "drizzle-orm";

import { db } from "./db";
import {
  attachments,
  followups,
  ideaSource,
  ideaStatus,
  ideaVersions,
  ideas,
} from "./db/schema";

export type IdeaStatus = (typeof ideaStatus.enumValues)[number];
export type IdeaSource = (typeof ideaSource.enumValues)[number];
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
