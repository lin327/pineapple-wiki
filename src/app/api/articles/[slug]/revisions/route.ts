import { NextRequest } from "next/server";
import { db } from "@/db";
import { articles, revisions } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  handleUnknownError,
} from "@/lib/api";
import { eq, desc } from "drizzle-orm";

export async function GET(
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

    const revisionList = await db
      .select({
        id: revisions.id,
        content: revisions.content,
        createdAt: revisions.createdAt,
      })
      .from(revisions)
      .where(eq(revisions.articleId, article.id))
      .orderBy(desc(revisions.createdAt));

    return successResponse(revisionList);
  } catch {
    return handleUnknownError();
  }
}
