import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, articleTags } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  handleZodError,
  handleUnknownError,
} from "@/lib/api";
import { eq, desc, asc, ilike, and, inArray, count } from "drizzle-orm";

// * 转义 LIKE 通配符 — 防止用户输入的 % 和 _ 被当作模式匹配符
function escapeLikePattern(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

// * 创建文章的入参校验 schema
// * slug 格式限制为小写字母、数字和连字符，用于 URL 友好路径
const createArticleSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(255),
  slug: z
    .string()
    .min(1, "slug 不能为空")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符"),
  content: z.string().min(1, "内容不能为空"),
  categoryId: z.number().int().positive().optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    // * 分页参数 — page 从 1 开始，limit 上限 100 防止过量查询
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "newest";

    // * 动态构建 WHERE 条件 — 支持按分类、标签、关键词组合筛选
    const conditions = [];

    if (category) {
      const categoryRow = await db().query.categories.findFirst({
        where: (c, { eq }) => eq(c.slug, category),
      });
      if (categoryRow) {
        conditions.push(eq(articles.categoryId, categoryRow.id));
      }
    }

    if (q) {
      conditions.push(ilike(articles.title, `%${escapeLikePattern(q)}%`));
    }

    // * 标签筛选 — 先查标签关联的文章 ID，再用 inArray 过滤
    // ? 标签不存在时静默跳过，是否应该返回空结果或报错？
    if (tag) {
      const tagRow = await db().query.tags.findFirst({
        where: (t, { eq }) => eq(t.name, tag),
      });
      if (tagRow) {
        const tagArticleIds = await db()
          .select({ articleId: articleTags.articleId })
          .from(articleTags)
          .where(eq(articleTags.tagId, tagRow.id));
        const ids = tagArticleIds.map((r) => r.articleId);
        if (ids.length === 0) {
          return successResponse({
            articles: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
        conditions.push(inArray(articles.id, ids));
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // * 排序逻辑 — newest(默认)/oldest 按时间，title 按字母序
    const orderFn =
      sort === "oldest"
        ? asc(articles.createdAt)
        : sort === "title"
          ? asc(articles.title)
          : desc(articles.createdAt);

    // * 先查总数用于分页元数据，再查当前页数据
    const [{ total }] = await db()
      .select({ total: count() })
      .from(articles)
      .where(where);

    const data = await db()
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        categoryId: articles.categoryId,
        isPublished: articles.isPublished,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(where)
      .orderBy(orderFn)
      .limit(limit)
      .offset((page - 1) * limit);

    return successResponse({
      articles: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return handleZodError(error);
    return handleUnknownError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createArticleSchema.parse(body);

    // ! slug 唯一性检查 — 重复 slug 返回 409 Conflict
    const existing = await db().query.articles.findFirst({
      where: (a, { eq }) => eq(a.slug, parsed.slug),
    });
    if (existing) {
      return errorResponse("SLUG_EXISTS", "该 slug 已存在", 409);
    }

    // * 插入文章并返回完整记录（.returning() 是 Drizzle 的 PostgreSQL 特性）
    const [article] = await db()
      .insert(articles)
      .values({
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content,
        categoryId: parsed.categoryId,
        isPublished: parsed.isPublished ?? false,
      })
      .returning();

    // * 批量插入标签关联 — 仅在 tagIds 非空时执行
    if (parsed.tagIds && parsed.tagIds.length > 0) {
      await db().insert(articleTags).values(
        parsed.tagIds.map((tagId) => ({
          articleId: article.id,
          tagId,
        }))
      );
    }

    return successResponse(article, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return handleZodError(error);
    return handleUnknownError();
  }
}
