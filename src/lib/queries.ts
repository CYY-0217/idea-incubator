import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "./db";
import {
  attachments,
  followups,
  ideaSource,
  ideaStatus,
  ideaTags,
  ideaVersions,
  ideas,
  panelReviews,
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
  tags: string[];
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

export async function listIdeas(
  status?: IdeaStatus,
  tag?: string,
): Promise<Idea[]> {
  if (tag) {
    const rows = await db
      .select({ idea: ideas })
      .from(ideas)
      .innerJoin(ideaTags, eq(ideaTags.ideaId, ideas.id))
      .innerJoin(tags, eq(tags.id, ideaTags.tagId))
      .where(
        and(
          status ? eq(ideas.status, status) : undefined,
          eq(tags.name, tag),
        ),
      )
      .orderBy(desc(ideas.updatedAt));
    return rows.map((r) => r.idea);
  }
  return db
    .select()
    .from(ideas)
    .where(status ? eq(ideas.status, status) : undefined)
    .orderBy(desc(ideas.updatedAt));
}

/** 一批想法各自的标签名（首页卡片用，一次查询防 N+1） */
export async function tagsForIdeas(
  ideaIds: number[],
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (ideaIds.length === 0) return map;
  const rows = await db
    .select({ ideaId: ideaTags.ideaId, name: tags.name })
    .from(ideaTags)
    .innerJoin(tags, eq(tags.id, ideaTags.tagId))
    .where(inArray(ideaTags.ideaId, ideaIds));
  for (const row of rows) {
    const list = map.get(row.ideaId) ?? [];
    list.push(row.name);
    map.set(row.ideaId, list);
  }
  return map;
}

/** 全部标签按使用次数倒序（首页标签筛选条） */
export async function getAllTags(): Promise<Array<{ name: string; count: number }>> {
  return db
    .select({ name: tags.name, count: sql<number>`count(*)` })
    .from(tags)
    .innerJoin(ideaTags, eq(ideaTags.tagId, tags.id))
    .groupBy(tags.id, tags.name)
    .orderBy(desc(sql`count(*)`))
    .limit(12);
}

export async function getIdea(id: number): Promise<IdeaDetail | null> {
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, id));
  if (!idea) return null;

  const [versions, files, questions, tagRows] = await Promise.all([
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
    db
      .select({ name: tags.name })
      .from(ideaTags)
      .innerJoin(tags, eq(tags.id, ideaTags.tagId))
      .where(eq(ideaTags.ideaId, id)),
  ]);

  return {
    idea,
    versions,
    attachments: files,
    followups: questions,
    tags: tagRows.map((t) => t.name),
  };
}

export async function getAttachmentById(id: number): Promise<Attachment | null> {
  const [row] = await db.select().from(attachments).where(eq(attachments.id, id));
  return row ?? null;
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

/* ---------- AI 评审团 ---------- */

export type PanelRow = typeof panelReviews.$inferSelect;

export async function getPanels(ideaId: number): Promise<PanelRow[]> {
  return db
    .select()
    .from(panelReviews)
    .where(eq(panelReviews.ideaId, ideaId))
    .orderBy(desc(panelReviews.createdAt));
}

export async function addPanelReview(input: {
  ideaId: number;
  payload: { reviews: Array<{ persona: string; verdict: string; comment: string }> };
  origin: VersionOrigin;
}): Promise<PanelRow> {
  const [row] = await db
    .insert(panelReviews)
    .values({ ideaId: input.ideaId, payload: input.payload, origin: input.origin })
    .returning();
  return row;
}

/* ---------- 想法图谱 ---------- */

export type GraphData = {
  nodes: Array<{
    id: number;
    title: string;
    status: IdeaStatus;
    versionCount: number;
  }>;
  edges: Array<{ a: number; b: number; score: number }>;
};

/** 全部想法为节点、活跃想法之间的 Jaccard 相似度为边 */
export async function getGraph(threshold = 0.15): Promise<GraphData> {
  const all = await listIdeas();
  const versionMap = await versionCountsForIdeas(all.map((i) => i.id));
  const nodes = all.map((i) => ({
    id: i.id,
    title: i.rawText,
    status: i.status,
    versionCount: versionMap.get(i.id) ?? 0,
  }));

  const active = all.filter(
    (i) =>
      i.status === "seed" || i.status === "shaping" || i.status === "proving",
  );
  const grams = active.map((i) => ({ id: i.id, set: bigrams(i.rawText) }));
  const edges: GraphData["edges"] = [];
  for (let i = 0; i < grams.length; i++) {
    for (let j = i + 1; j < grams.length; j++) {
      const score = jaccard(grams[i].set, grams[j].set);
      if (score >= threshold) {
        edges.push({ a: grams[i].id, b: grams[j].id, score });
      }
    }
  }
  edges.sort((x, y) => y.score - x.score);

  return { nodes, edges };
}

/* ---------- 首页概览 ---------- */

export type HomeEvent = {
  kind: "created" | "version" | "followup";
  ideaId: number;
  ideaTitle: string;
  at: Date;
  label: string;
};

export type HomeOverview = {
  total: number;
  newThisWeek: number;
  expandedTotal: number;
  statusCounts: Record<IdeaStatus, number>;
  recentEvents: HomeEvent[];
};

const ORIGIN_LABEL: Record<string, string> = {
  zcode: "ZCode",
  deepseek: "DeepSeek",
  manual: "手动",
};

export async function getHomeOverview(): Promise<HomeOverview> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const all = await db.select().from(ideas).orderBy(desc(ideas.updatedAt));

  const statusCounts: Record<IdeaStatus, number> = {
    seed: 0,
    shaping: 0,
    proving: 0,
    paused: 0,
    shipped: 0,
  };
  for (const i of all) statusCounts[i.status]++;

  const [{ count: expandedTotal }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ideaVersions);

  const [createdRows, versionRows, followupRows] = await Promise.all([
    db
      .select({ id: ideas.id, title: ideas.rawText, at: ideas.createdAt })
      .from(ideas)
      .orderBy(desc(ideas.createdAt))
      .limit(6),
    db
      .select({
        ideaId: ideaVersions.ideaId,
        vNo: ideaVersions.vNo,
        origin: ideaVersions.origin,
        at: ideaVersions.createdAt,
        title: ideas.rawText,
      })
      .from(ideaVersions)
      .innerJoin(ideas, eq(ideas.id, ideaVersions.ideaId))
      .orderBy(desc(ideaVersions.createdAt))
      .limit(6),
    db
      .select({
        ideaId: followups.ideaId,
        at: followups.createdAt,
        title: ideas.rawText,
      })
      .from(followups)
      .innerJoin(ideas, eq(ideas.id, followups.ideaId))
      .orderBy(desc(followups.createdAt))
      .limit(6),
  ]);

  const recentEvents = [
    ...createdRows.map((r) => ({
      kind: "created" as const,
      ideaId: r.id,
      ideaTitle: r.title,
      at: r.at,
      label: "扔进了收件箱",
    })),
    ...versionRows.map((r) => ({
      kind: "version" as const,
      ideaId: r.ideaId,
      ideaTitle: r.title,
      at: r.at,
      label: `展开出 v${r.vNo} · ${ORIGIN_LABEL[r.origin] ?? r.origin}`,
    })),
    ...followupRows.map((r) => ({
      kind: "followup" as const,
      ideaId: r.ideaId,
      ideaTitle: r.title,
      at: r.at,
      label: "回答了 AI 追问",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return {
    total: all.length,
    newThisWeek: all.filter((i) => i.createdAt >= weekAgo).length,
    expandedTotal: Number(expandedTotal),
    statusCounts,
    recentEvents,
  };
}

/** 一批想法各自的版本数（卡片「在生长」徽标，一次查询防 N+1） */
export async function versionCountsForIdeas(
  ideaIds: number[],
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (ideaIds.length === 0) return map;
  const rows = await db
    .select({ ideaId: ideaVersions.ideaId, count: sql<number>`count(*)` })
    .from(ideaVersions)
    .where(inArray(ideaVersions.ideaId, ideaIds))
    .groupBy(ideaVersions.ideaId);
  for (const row of rows) map.set(row.ideaId, Number(row.count));
  return map;
}

/* ---------- 周回顾 ---------- */

export type WeeklyReview = {
  newThisWeek: Idea[];
  expandedThisWeek: number;
  shippedTotal: number;
  stale: Array<Idea & { silentDays: number }>;
  pairs: Array<{ a: Idea; b: Idea; score: number }>;
};

/** 字符二元组 Jaccard 相似度：零成本本地查重，够发现"其实是同一件事" */
export function bigrams(text: string): Set<string> {
  const s = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export async function getWeeklyReview(): Promise<WeeklyReview> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const all = await listIdeas();

  const newThisWeek = all.filter((i) => i.createdAt >= weekAgo);
  const stale = all
    .filter(
      (i) =>
        i.updatedAt < weekAgo &&
        (i.status === "seed" || i.status === "shaping" || i.status === "proving"),
    )
    .map((i) => ({
      ...i,
      silentDays: Math.floor((Date.now() - i.updatedAt.getTime()) / 86_400_000),
    }))
    .sort((a, b) => b.silentDays - a.silentDays)
    .slice(0, 8);

  const [{ count: expandedThisWeek }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ideaVersions)
    .where(gte(ideaVersions.createdAt, weekAgo));

  const [{ count: shippedTotal }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(ideas)
    .where(eq(ideas.status, "shipped"));

  // 相似配对：只看活跃想法（种子/展开中/推进中）
  const active = all.filter(
    (i) => i.status === "seed" || i.status === "shaping" || i.status === "proving",
  );
  const grams = active.map((i) => ({ idea: i, set: bigrams(i.rawText) }));
  const pairs: WeeklyReview["pairs"] = [];
  for (let i = 0; i < grams.length; i++) {
    for (let j = i + 1; j < grams.length; j++) {
      const score = jaccard(grams[i].set, grams[j].set);
      if (score >= 0.18) pairs.push({ a: grams[i].idea, b: grams[j].idea, score });
    }
  }
  pairs.sort((x, y) => y.score - x.score);

  return {
    newThisWeek,
    expandedThisWeek: Number(expandedThisWeek),
    shippedTotal: Number(shippedTotal),
    stale,
    pairs: pairs.slice(0, 3),
  };
}
