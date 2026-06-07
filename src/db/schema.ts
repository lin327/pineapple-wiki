import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ═══════════════════════════════════════════════
//  现有表（保留，articles 重新定位为 Runbook 载体）
// ═══════════════════════════════════════════════

// * 文档分类表 — 用于文章的分类组织，slug 作为 URL 友好的唯一标识

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
});

// * 文章表 — Wiki/Runbook 核心表，存储文章内容及发布状态
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// * 标签表 — 文章多对多标签关联的标签端
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

// * 文章-标签关联表 — 多对多中间表，联合唯一约束防止重复关联
export const articleTags = pgTable(
  "article_tags",
  {
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (t) => [unique().on(t.articleId, t.tagId)],
);

// * 文章修订历史表 — 记录每次内容变更，支持版本回溯
export const revisions = pgTable("revisions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id")
    .notNull()
    .references(() => articles.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════
//  新增：CMDB 图关系层
// ═══════════════════════════════════════════════

// * 实体类型枚举值 — 定义图中所有可能的节点类型
// * node=服务器/主机, service=微服务, domain=域名, person=人员, runbook=运维手册, alert=告警规则
export type EntityType =
  | "node"
  | "service"
  | "domain"
  | "person"
  | "runbook"
  | "alert";

// * 关系类型枚举值 — 定义实体之间的有向边类型，箭头方向为 source → target
export type EdgeRelation =
  | "runs_on"      // service → node
  | "exposes"      // domain → service
  | "owns"         // person → service / node
  | "fixes"        // runbook → service / alert
  | "alerts_on"    // alert → service / node
  | "depends_on"   // service → service
  | "calls";       // service → service (调用链)

// * 变更事件类型 — 记录基础设施变更的操作分类
export type ChangeAction =
  | "deploy"
  | "config_change"
  | "scale"
  | "incident"
  | "alert_fire"
  | "alert_resolve"
  | "maintenance";

// * 实体表 — 图的核心节点，存储所有基础设施对象
// ! 注意：type 字段未使用 DB enum，应用层需校验 EntityType 合法性
export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(), // EntityType
  name: varchar("name", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  tier: varchar("tier", { length: 5 }), // P0 | P1 | P2
  status: varchar("status", { length: 20 }).default("running"), // running | stopped | degraded | unknown
  metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// * 边表 — 图的有向边，表示实体间的关系
// ! 联合唯一约束 (sourceId, targetId, relation) 防止重复关系
// ! onDelete: cascade — 删除实体时自动清理关联边
export const edges = pgTable(
  "edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    targetId: uuid("target_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    relation: varchar("relation", { length: 20 }).notNull(), // EdgeRelation
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.sourceId, t.targetId, t.relation)],
);

// * 变更事件表 — 记录基础设施的变更历史，用于审计和回溯
// ! entityId 可为 null（onDelete: set null），实体删除后变更记录仍保留
export const changes = pgTable("changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, {
    onDelete: "set null",
  }),
  action: varchar("action", { length: 30 }).notNull(), // ChangeAction
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  operator: varchar("operator", { length: 100 }),
  severity: varchar("severity", { length: 20 }).default("info"), // info | warning | critical
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════
//  Relations（Drizzle 关系定义）
// ═══════════════════════════════════════════════

// * 现有关系 — Wiki 文档层的表关联定义
export const categoriesRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  tags: many(articleTags),
  revisions: many(revisions),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articles: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  article: one(articles, {
    fields: [revisions.articleId],
    references: [articles.id],
  }),
}));

// * 新增图关系 — CMDB 图层的表关联定义
// * entities 有 outgoingEdges 和 incomingEdges 两个方向的边关系
export const entitiesRelations = relations(entities, ({ many }) => ({
  outgoingEdges: many(edges, { relationName: "source" }),
  incomingEdges: many(edges, { relationName: "target" }),
  changes: many(changes),
}));

export const edgesRelations = relations(edges, ({ one }) => ({
  source: one(entities, {
    fields: [edges.sourceId],
    references: [entities.id],
    relationName: "source",
  }),
  target: one(entities, {
    fields: [edges.targetId],
    references: [entities.id],
    relationName: "target",
  }),
}));

export const changesRelations = relations(changes, ({ one }) => ({
  entity: one(entities, {
    fields: [changes.entityId],
    references: [entities.id],
  }),
}));
