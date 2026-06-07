import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { articles, articleTags, revisions } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  handleZodError,
  handleUnknownError,
} from "@/lib/api";
import { eq, and } from "drizzle-orm";

const updateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符")
    .optional(),
  content: z.string().min(1).optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  isPublished: z.boolean().optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.slug, slug),
      with: {
        category: true,
      },
    });

    if (!article) {
      return errorResponse("NOT_FOUND", "文章不存在", 404);
    }

    const articleTagRows = await db
      .select({ tagId: articleTags.tagId })
      .from(articleTags)
      .where(eq(articleTags.articleId, article.id));

    const tagIds = articleTagRows.map((r) => r.tagId);

    return successResponse({ ...article, tagIds });
  } catch {
    return handleUnknownError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = updateArticleSchema.parse(body);

    const article = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.slug, slug),
    });

    if (!article) {
      return errorResponse("NOT_FOUND", "文章不存在", 404);
    }

    if (parsed.slug && parsed.slug !== slug) {
      const slugConflict = await db.query.articles.findFirst({
        where: (a, { eq }) => eq(a.slug, parsed.slug!),
      });
      if (slugConflict) {
        return errorResponse("SLUG_EXISTS", "该 slug 已存在", 409);
      }
    }

    // Save revision before updating
    await db.insert(revisions).values({
      articleId: article.id,
      content: article.content,
    });

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.slug !== undefined) updateData.slug = parsed.slug;
    if (parsed.content !== undefined) updateData.content = parsed.content;
    if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId;
    if (parsed.isPublished !== undefined) updateData.isPublished = parsed.isPublished;

    const [updated] = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, article.id))
      .returning();

    if (parsed.tagIds !== undefined) {
      await db
        .delete(articleTags)
        .where(eq(articleTags.articleId, article.id));

      if (parsed.tagIds.length > 0) {
        await db.insert(articleTags).values(
          parsed.tagIds.map((tagId) => ({
            articleId: article.id,
            tagId,
          }))
        );
      }
    }

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return handleZodError(error);
    return handleUnknownError();
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const article = await db.query.articles.findFirst({
      where: (a, { eq }) => eq(a.slug, slug),
    });

    if (!article) {
      return errorResponse("NOT_FOUND", "文章不存在", 404);
    }

    // Delete related data first
    await db.delete(articleTags).where(eq(articleTags.articleId, article.id));
    await db.delete(revisions).where(eq(revisions.articleId, article.id));
    await db.delete(articles).where(eq(articles.id, article.id));

    return successResponse({ id: article.id });
  } catch {
    return handleUnknownError();
  }
}
