import "dotenv/config";
import { db } from "./index";
import { categories, tags, articles, articleTags } from "./schema";

async function seed() {
  console.log("🌱 开始插入示例数据...\n");

  // 1. 创建分类
  console.log("📁 创建分类...");
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: "技术笔记", slug: "tech-notes" },
      { name: "学习心得", slug: "learning" },
      { name: "项目记录", slug: "projects" },
    ])
    .returning();
  console.log(`   ✅ 已创建 ${insertedCategories.length} 个分类`);

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // 2. 创建标签
  console.log("🏷️  创建标签...");
  const insertedTags = await db
    .insert(tags)
    .values([
      { name: "Next.js" },
      { name: "TypeScript" },
      { name: "Docker" },
      { name: "PostgreSQL" },
      { name: "Tailwind" },
    ])
    .returning();
  console.log(`   ✅ 已创建 ${insertedTags.length} 个标签`);

  const tagMap = Object.fromEntries(
    insertedTags.map((t) => [t.name, t.id])
  );

  // 3. 创建文章
  console.log("📝 创建文章...");

  const articlesData = [
    {
      title: "Next.js 15 App Router 入门指南",
      slug: "nextjs-15-app-router",
      content: `# Next.js 15 App Router 入门指南

## 什么是 App Router？

Next.js 13 引入了全新的 App Router，基于 React Server Components 构建，提供了更灵活的路由和布局系统。

## 核心概念

### 文件系统路由

\`\`\`
app/
├── layout.tsx        # 根布局
├── page.tsx          # 首页
├── about/
│   └── page.tsx      # /about
└── blog/
    ├── page.tsx      # /blog
    └── [slug]/
        └── page.tsx  # /blog/:slug
\`\`\`

### Server Components vs Client Components

- **Server Components**（默认）：在服务端渲染，可以直接访问数据库
- **Client Components**：使用 \`"use client"\` 指令，支持交互和浏览器 API

### 数据获取

\`\`\`tsx
// Server Component - 直接 async
async function BlogPage() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json())
  return <PostList posts={posts} />
}
\`\`\`

## 总结

App Router 是 Next.js 的未来方向，建议新项目都采用这种方式构建。`,
      categoryId: catMap["tech-notes"],
      isPublished: true,
      tagNames: ["Next.js", "TypeScript"],
    },
    {
      title: "TypeScript 高级类型体操笔记",
      slug: "typescript-advanced-types",
      content: `# TypeScript 高级类型体操笔记

## 条件类型

条件类型可以根据类型关系选择不同的类型分支：

\`\`\`typescript
type IsString<T> = T extends string ? true : false

type A = IsString<"hello"> // true
type B = IsString<42>      // false
\`\`\`

## 模板字面量类型

\`\`\`typescript
type EventName = \`on\$\{Capitalize<string>}\`
type CSSProperty = \`\$\{'margin' | 'padding'}-\$\{'top' | 'bottom' | 'left' | 'right'}\`
\`\`\`

## infer 关键字

用于在条件类型中提取类型：

\`\`\`typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never
type UnpackPromise<T> = T extends Promise<infer U> ? U : T
\`\`\`

## 实用工具类型实现

\`\`\`typescript
// DeepPartial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// DeepReadonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
\`\`\`

掌握这些高级类型技巧，能让你写出更安全、更具表达力的 TypeScript 代码。`,
      categoryId: catMap["learning"],
      isPublished: true,
      tagNames: ["TypeScript"],
    },
    {
      title: "Docker 多阶段构建最佳实践",
      slug: "docker-multi-stage-build",
      content: `# Docker 多阶段构建最佳实践

## 为什么使用多阶段构建？

多阶段构建可以显著减小镜像体积，将构建环境和运行环境分离。

## Next.js 项目示例

\`\`\`dockerfile
# 阶段一：安装依赖
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 阶段二：构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 阶段三：运行
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

## 优化技巧

1. **利用缓存层**：先复制 \`package.json\`，再复制源码
2. **使用 alpine 基础镜像**：体积更小
3. **合理排序 COPY 指令**：变化频率低的文件优先
4. **使用 .dockerignore**：排除不必要的文件

## 镜像体积对比

| 方式 | 镜像大小 |
|------|---------|
| 单阶段构建 | ~1.2GB |
| 多阶段构建 | ~180MB |
| 多阶段 + alpine | ~120MB |`,
      categoryId: catMap["tech-notes"],
      isPublished: true,
      tagNames: ["Docker", "Next.js"],
    },
    {
      title: "PostgreSQL 性能优化实战",
      slug: "postgresql-performance",
      content: `# PostgreSQL 性能优化实战

## EXPLAIN ANALYZE 基础

\`\`\`sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
ORDER BY order_count DESC
LIMIT 10;
\`\`\`

## 索引优化策略

### 复合索引

\`\`\`sql
-- 针对常见查询模式创建复合索引
CREATE INDEX idx_orders_user_status
ON orders (user_id, status)
WHERE status != 'cancelled';
\`\`\`

### 部分索引

\`\`\`sql
-- 只索引活跃用户
CREATE INDEX idx_active_users
ON users (email)
WHERE is_active = true;
\`\`\`

## 连接池配置

使用 Neon 的连接池时，推荐配置：

\`\`\`typescript
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
\`\`\`

## 常见性能陷阱

1. N+1 查询问题
2. 缺少索引的 WHERE 条件
3. SELECT * 取了不必要的列
4. 大表没有分页`,
      categoryId: catMap["tech-notes"],
      isPublished: true,
      tagNames: ["PostgreSQL"],
    },
    {
      title: "Wiki 项目开发日志",
      slug: "wiki-project-log",
      content: `# Wiki 知识库项目开发日志

## 项目概述

这是一个个人知识库系统，用于整理技术笔记、学习心得和项目记录。

## 技术选型

| 技术 | 选择理由 |
|------|---------|
| Next.js 15 | App Router + RSC，开发体验好 |
| Drizzle ORM | 类型安全，轻量级 |
| Neon | Serverless PostgreSQL，免费额度够用 |
| Tailwind CSS 4 | 原子化 CSS，开发效率高 |
| Tiptap | 富文本编辑器，扩展性强 |

## 开发进度

- [x] 项目初始化
- [x] 数据库 Schema 设计
- [x] 基础 CRUD API
- [ ] 文章编辑器
- [ ] 分类和标签管理
- [ ] 搜索功能
- [ ] 部署上线

## 数据库设计

\`\`\`
categories  ──┐
              ├── articles ──── article_tags ──── tags
              │
              └── revisions
\`\`\`

## 遇到的问题

### 1. Drizzle 关系查询

Drizzle 的关系查询语法和 Prisma 不太一样，需要手动定义 relations。

### 2. Neon 连接池

Serverless 环境下需要注意连接池的配置，避免连接数过多。

## 下一步

1. 完成 Tiptap 编辑器集成
2. 实现全文搜索
3. 添加用户认证`,
      categoryId: catMap["projects"],
      isPublished: true,
      tagNames: ["Next.js", "TypeScript", "Tailwind", "PostgreSQL"],
    },
  ];

  for (const articleData of articlesData) {
    const { tagNames, ...articleValues } = articleData;

    const [inserted] = await db
      .insert(articles)
      .values(articleValues)
      .returning();

    // 插入文章-标签关联
    const tagAssociations = tagNames.map((tagName) => ({
      articleId: inserted.id,
      tagId: tagMap[tagName],
    }));

    await db.insert(articleTags).values(tagAssociations);

    console.log(`   ✅ 《${inserted.title}》 → [${tagNames.join(", ")}]`);
  }

  // 4. 验证数据
  console.log("\n🔍 验证插入结果...\n");

  const allCategories = await db.select().from(categories);
  const allTags = await db.select().from(tags);
  const allArticles = await db.select().from(articles);
  const allArticleTags = await db.select().from(articleTags);

  console.log(`📁 分类: ${allCategories.length} 个`);
  allCategories.forEach((c) => console.log(`   - ${c.name} (${c.slug})`));

  console.log(`\n🏷️  标签: ${allTags.length} 个`);
  allTags.forEach((t) => console.log(`   - ${t.name}`));

  console.log(`\n📝 文章: ${allArticles.length} 篇`);
  allArticles.forEach((a) =>
    console.log(`   - ${a.title} [${a.isPublished ? "已发布" : "草稿"}]`)
  );

  console.log(`\n🔗 文章-标签关联: ${allArticleTags.length} 条`);

  console.log("\n✨ 示例数据插入完成！");
}

seed().catch((err) => {
  console.error("❌ 插入失败:", err);
  process.exit(1);
});
