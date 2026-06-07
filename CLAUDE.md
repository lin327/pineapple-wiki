# Wiki 知识库

## 技术栈
- Next.js 15 App Router + TypeScript
- Drizzle ORM + Neon PostgreSQL
- Tailwind CSS 4
- Tiptap 编辑器
- Docker 多阶段构建

## 关键命令
- `npm run dev` — 开发服务器
- `npm run build` — 构建验证
- `npx drizzle-kit generate` — 生成迁移
- `npx drizzle-kit push` — 推送 schema

## 代码规范
- 组件用 PascalCase，文件名用 kebab-case
- API 统一响应格式：{ success, data, error }
- 所有 API 入参用 Zod 校验
- 样式参考 PROJECT.md 的 UI 设计规范
