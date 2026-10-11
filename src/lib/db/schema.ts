import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// 状态流：种子 → 展开中 → 推进中 → 落地；paused 为搁置旁路
export const ideaStatus = pgEnum("idea_status", [
  "seed",
  "shaping",
  "proving",
  "paused",
  "shipped",
]);

// 输入形态；screenshot 为明晚预留位
export const ideaSource = pgEnum("idea_source", [
  "keyword",
  "text",
  "paste",
  "screenshot",
]);

// 版本来源：ZCode 代跑 / DeepSeek API / 手动编辑
export const versionOrigin = pgEnum("version_origin", [
  "zcode",
  "deepseek",
  "manual",
]);

export const ideas = pgTable(
  "ideas",
  {
    id: serial("id").primaryKey(),
    // 预留多用户，V0 单用户恒为 null
    userId: text("user_id"),
    rawText: text("raw_text").notNull(),
    source: ideaSource("source").notNull().default("text"),
    status: ideaStatus("status").notNull().default("seed"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ideas_status_idx").on(t.status),
    index("ideas_updated_at_idx").on(t.updatedAt),
  ],
);

export const ideaVersions = pgTable(
  "idea_versions",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    vNo: integer("v_no").notNull(),
    // 九字段展开结果，结构见 lib/expand-schema.ts（P15）
    payload: jsonb("payload").notNull(),
    origin: versionOrigin("origin").notNull().default("zcode"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("idea_versions_idea_vno_idx").on(t.ideaId, t.vNo)],
);

export const attachments = pgTable(
  "attachments",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    kind: text("kind").notNull().default("screenshot"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("attachments_idea_idx").on(t.ideaId)],
);

export const followups = pgTable(
  "followups",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("followups_idea_idx").on(t.ideaId)],
);

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const ideaTags = pgTable(
  "idea_tags",
  {
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    uniqueIndex("idea_tags_idea_tag_idx").on(t.ideaId, t.tagId),
    index("idea_tags_tag_idx").on(t.tagId),
  ],
);

// AI 评审团：四角色（产品/技术/用户/投资）对一次想法的辩论记录
export const panelReviews = pgTable(
  "panel_reviews",
  {
    id: serial("id").primaryKey(),
    ideaId: integer("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    // { reviews: [{ persona, verdict, comment }] }
    payload: jsonb("payload").notNull(),
    origin: versionOrigin("origin").notNull().default("zcode"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("panel_reviews_idea_idx").on(t.ideaId)],
);
