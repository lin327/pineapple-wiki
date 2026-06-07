# Wiki 知识库 — 项目规划

## 技术栈

| 层 | 方案 | 版本 |
| --- | --- | --- |
| 框架 | Next.js (App Router) | 15.x |
| 语言 | TypeScript | 5.x |
| ORM | Drizzle ORM | latest |
| 数据库 | Neon PostgreSQL | serverless |
| 样式 | Tailwind CSS | 4.x |
| 编辑器 | Tiptap (Markdown) | latest |
| 搜索 | Neon pg_trgm | 内置 |
| 容器 | Docker + Docker Compose | - |
| 部署 | Vercel / 自建 Docker | - |

---

## 数据库设计

### articles 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | serial | 主键 |
| title | varchar(255) | 标题 |
| slug | varchar(255) | URL 友好标识，唯一 |
| content | text | Markdown 内容 |
| category_id | integer | 外键 → categories |
| is_published | boolean | 是否发布 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### categories 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | serial | 主键 |
| name | varchar(100) | 分类名 |
| slug | varchar(100) | URL 标识，唯一 |

### tags 表

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | serial | 主键 |
| name | varchar(50) | 标签名，唯一 |

### article_tags 表（多对多）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| article_id | integer | 外键 → articles |
| tag_id | integer | 外键 → tags |

### revisions 表（版本历史）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | serial | 主键 |
| article_id | integer | 外键 → articles |
| content | text | 该版本内容 |
| created_at | timestamp | 保存时间 |

---

## 页面路由

```text
/                    → 首页：文章列表 + 搜索栏
/wiki/[slug]         → 文章详情（Markdown 渲染）
/edit                → 新建文章
/edit/[slug]         → 编辑文章
/category/[slug]     → 分类下的文章列表
/search?q=xxx        → 搜索结果
```

---

## API 路由 (Route Handlers)

```text
GET    /api/articles           → 文章列表（支持 ?category=&tag=&q=）
POST   /api/articles           → 新建文章
GET    /api/articles/[slug]    → 文章详情
PUT    /api/articles/[slug]    → 更新文章
DELETE /api/articles/[slug]    → 删除文章
GET    /api/articles/[slug]/revisions → 版本历史
GET    /api/categories         → 分类列表
POST   /api/categories         → 新建分类
GET    /api/tags               → 标签列表
GET    /api/search?q=xxx       → 全文搜索
```

---

## 目录结构

```text
wiki/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── drizzle.config.ts
├── package.json
├── src/
│   ├── app/
│   │   ├── layout.tsx              → 全局布局（侧边栏 + 导航）
│   │   ├── page.tsx                → 首页
│   │   ├── wiki/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        → 文章详情
│   │   ├── edit/
│   │   │   ├── page.tsx            → 新建文章
│   │   │   └── [slug]/
│   │   │       └── page.tsx        → 编辑文章
│   │   ├── category/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        → 分类页
│   │   ├── search/
│   │   │   └── page.tsx            → 搜索结果
│   │   └── api/
│   │       ├── articles/
│   │       │   ├── route.ts        → GET 列表, POST 新建
│   │       │   └── [slug]/
│   │       │       ├── route.ts    → GET/PUT/DELETE 单篇
│   │       │       └── revisions/
│   │       │           └── route.ts→ GET 版本历史
│   │       ├── categories/
│   │       │   └── route.ts        → GET/POST
│   │       ├── tags/
│   │       │   └── route.ts        → GET
│   │       └── search/
│   │           └── route.ts        → GET 搜索
│   ├── db/
│   │   ├── index.ts                → Neon 连接
│   │   └── schema.ts               → Drizzle 表定义
│   ├── components/
│       ├── ArticleEditor.tsx       → Tiptap 编辑器
│       ├── ArticleList.tsx         → 文章列表
│       ├── ArticleCard.tsx         → 文章卡片
│       ├── Sidebar.tsx             → 侧边栏（分类+标签）
│       ├── SearchBar.tsx           → 搜索框
│       ├── RevisionHistory.tsx     → 版本历史
│       ├── TableOfContents.tsx     → 文章目录（TOC）
│       ├── Breadcrumb.tsx          → 面包屑导航
│       ├── Pagination.tsx          → 分页器
│       ├── Toast.tsx               → Toast 通知
│       └── CodeBlock.tsx           → 代码块（高亮+复制按钮）
├── drizzle/
│   └── migrations/                 → 数据库迁移文件
└── public/
```

---

## Dockerfile

```dockerfile
FROM node:20-alpine AS base

# --- deps ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- production ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

> 需在 `next.config.ts` 中设置 `output: 'standalone'` 才能用此 Dockerfile。

---

## docker-compose.yml

```yaml
services:
  wiki:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
```

---

## .env.example

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 关键依赖

```json
{
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "drizzle-orm": "latest",
    "@neondatabase/serverless": "latest",
    "@tiptap/react": "latest",
    "@tiptap/starter-kit": "latest",
    "@tiptap/extension-placeholder": "latest",
    "slugify": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "latest",
    "typescript": "latest",
    "@types/node": "latest",
    "@types/react": "latest"
  }
}
```

---

## 开发步骤（顺序）

1. **初始化项目** — Next.js + Tailwind + TypeScript
2. **配置数据库** — Drizzle schema + Neon 连接 + migration
3. **API 层** — 实现所有 Route Handlers
4. **页面** — 首页列表 → 文章详情 → 编辑器 → 搜索
5. **Tiptap 编辑器** — 集成 Markdown 编辑
6. **搜索功能** — pg_trgm 全文搜索
7. **版本历史** — 编辑时自动存 revision
8. **Docker** — Dockerfile + docker-compose
9. **部署** — Vercel 或自建服务器 Docker 部署

---

## UI 设计规范

### 风格

- **现代卡片风 + 亮色简约**
- 圆角卡片（border-radius: 12px）
- 柔和阴影（shadow-md / shadow-lg）
- 微动画过渡（hover scale、fade-in）
- 大量留白，呼吸感

### 配色

| 用途 | 颜色 | 说明 |
| --- | --- | --- |
| 主色 | `#2563EB` (blue-600) | 按钮、链接、高亮 |
| 主色 hover | `#1D4ED8` (blue-700) | 按钮悬浮 |
| 次色 | `#6366F1` (indigo-500) | 标签、装饰 |
| 背景 | `#F9FAFB` (gray-50) | 页面底色 |
| 卡片背景 | `#FFFFFF` | 卡片白底 |
| 文字主色 | `#111827` (gray-900) | 标题、正文 |
| 文字次色 | `#6B7280` (gray-500) | 描述、时间 |
| 边框 | `#E5E7EB` (gray-200) | 分割线、卡片边框 |
| 成功 | `#10B981` (green-500) | 发布状态 |
| 警告 | `#F59E0B` (amber-500) | 草稿状态 |

### 排版

| 元素 | 字号 | 字重 |
| --- | --- | --- |
| 页面标题 | text-3xl (30px) | font-bold |
| 文章标题 | text-xl (20px) | font-semibold |
| 正文 | text-base (16px) | font-normal |
| 辅助文字 | text-sm (14px) | font-normal |
| 标签 | text-xs (12px) | font-medium |

### 组件样式

**文章卡片：**

```text
┌──────────────────────────────────┐
│  [分类标签]          2024-06-07  │
│                                  │
│  📄 文章标题                      │
│  文章摘要描述，最多两行...        │
│                                  │
│  [tag1] [tag2]                   │
└──────────────────────────────────┘
```

- 白色背景、圆角 12px、shadow-sm
- hover 时 shadow-md + translateY(-2px)

**侧边栏：**

- 白色背景
- 分类列表带圆点指示器
- 标签用 pill 样式（小圆角胶囊）

**编辑器：**

- 白色卡片包裹
- 工具栏浅灰背景
- 输入区无边框，focus 时蓝色描边

**按钮：**

- 主按钮：蓝底白字，圆角 8px
- 次按钮：白底灰边
- 危险按钮：红底白字（删除用）

### 动画

| 元素 | 动画 | 时长 |
| --- | --- | --- |
| 卡片 hover | translateY(-2px) + shadow 升级 | 200ms |
| 页面切换 | fade-in | 300ms |
| 按钮点击 | scale(0.98) | 100ms |
| Toast 提示 | slide-in from top | 250ms |

### 响应式布局

- 桌面：侧边栏 + 内容区
- 移动端：侧边栏折叠为汉堡菜单，内容全宽
- 编辑器移动端适配（工具栏精简）

### 404 页面

- `src/app/not-found.tsx` — 全局 404
- 文章详情页找不到时显示"文章不存在"提示 + 返回首页链接

### Loading 状态

- `src/app/loading.tsx` — 全局骨架屏
- 文章列表、详情页用 `Suspense` 包裹，显示 skeleton 占位

### 输入校验

- 使用 **Zod** 校验所有 API 入参
- 统一错误格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "标题不能为空"
  }
}
```

### API 统一响应格式

```json
// 成功
{ "success": true, "data": { ... } }
// 失败
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### SEO

- 每页动态 `<title>` + `<meta description>`
- 文章页用 Open Graph 标签（`og:title`, `og:description`）
- `src/app/wiki/[slug]/page.tsx` 导出 `generateMetadata()`

### Middleware

- `src/middleware.ts` — 预留
- 后续加登录时用于保护 `/edit` 路由
- 初期可留空或仅做日志

### 依赖补充

```json
{
  "zod": "latest",
  "react-markdown": "latest",
  "remark-gfm": "latest",
  "rehype-highlight": "latest",
  "highlight.js": "latest"
}
```

### Markdown 渲染

- 使用 **react-markdown** + **remark-gfm**（支持表格、任务列表、删除线）
- 代码块用 **rehype-highlight** + **highlight.js** 语法高亮
- 代码块右上角显示语言标签 + 复制按钮
- 图片支持懒加载（loading="lazy"）

### 目录（TOC）

- 文章详情页右侧显示目录导航（桌面端）
- 自动提取 `##` `###` 标题生成锚点
- 滚动时高亮当前章节
- 移动端折叠为浮动按钮，点击展开

### 面包屑导航

- 文章详情页：首页 > 分类名 > 文章标题
- 分类页：首页 > 分类名

### 分页

- 文章列表默认每页 12 篇
- 底部分页器（上一页 / 页码 / 下一页）
- API 支持 `?page=1&limit=12`

### 排序与筛选

- 文章列表支持：最新 / 最早 / 标题 A-Z
- 分类筛选 + 标签筛选可组合

### 图片处理

- Markdown 中图片正常渲染
- 后续扩展：上传到 S3 / 本地 public 目录
- 初期支持外链图片

### 键盘快捷键（编辑器）

| 快捷键 | 功能 |
| --- | --- |
| Ctrl+S / Cmd+S | 保存 |
| Ctrl+B / Cmd+B | 加粗 |
| Ctrl+I / Cmd+I | 斜体 |
| Ctrl+K / Cmd+K | 插入链接 |

### Toast 通知

- 操作成功/失败时右上角弹出提示
- 自动 3 秒消失
- 类型：success（绿）/ error（红）/ info（蓝）

---

## 扩展功能（后续可加）

- [ ] 用户登录（NextAuth.js）
- [ ] 文章权限（公开/私有）
- [ ] 图片上传（S3 / 本地）
- [ ] 暗黑模式
- [ ] 文章目录（TOC）
- [ ] 文章间双向链接（[[article-slug]]）
- [ ] 导出 Markdown / PDF
