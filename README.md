# Wiki 知识库

基于 Next.js 15 的个人知识库系统，支持 Markdown 编辑、分类管理、全文搜索和版本历史。

## 技术栈

| 层 | 方案 |
| --- | --- ||
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| ORM | Drizzle ORM |
| 数据库 | Neon PostgreSQL |
| 样式 | Tailwind CSS 4 |
| 编辑器 | Tiptap |
| 测试 | Vitest + Playwright |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 并填入 Neon 数据库连接字符串：

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.aws.neon.tech/neondb?sslmode=require
```

### 3. 初始化数据库

```bash
npx drizzle-kit push    # 推送 schema
npm run db:seed          # 插入示例数据（可选）
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 常用命令

| 命令 | 说明 |
| --- | --- ||
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 单元测试 (Vitest) |
| `npm run test:e2e` | E2E 测试 (Playwright) |
| `npx drizzle-kit generate` | 生成迁移文件 |
| `npx drizzle-kit push` | 推送 schema 到数据库 |

## 项目结构

```text
src/
├── app/
│   ├── api/              # API 路由
│   │   ├── articles/     # 文章 CRUD
│   │   ├── categories/   # 分类管理
│   │   ├── tags/         # 标签
│   │   └── search/       # 搜索
│   ├── wiki/[slug]/      # 文章详情
│   ├── edit/             # 编辑器
│   ├── category/[slug]/  # 分类页
│   └── search/           # 搜索结果
├── components/           # UI 组件
├── db/
│   ├── schema.ts         # Drizzle 表定义
│   └── seed.ts           # 示例数据
└── lib/
    └── api.ts            # API 工具函数
```

## 数据库

5 张表：`articles`、`categories`、`tags`、`article_tags`（多对多）、`revisions`（版本历史）

详见 [PROJECT.md](./PROJECT.md)

## 部署

### Docker

```bash
docker compose up -d
```

### Fly.io

```bash
fly deploy
```

## 许可

MIT
