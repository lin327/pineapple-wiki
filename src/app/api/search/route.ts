import { NextRequest } from "next/server";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { successResponse, handleUnknownError } from "@/lib/api";
import { ilike, or, desc } from "drizzle-orm";

function escapeLikePattern(s: string): string {
  return s.replace(/[%_]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return successResponse([]);
    }

    const pattern = `%${escapeLikePattern(q.trim())}%`;

    const results = await db()
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
      .where(
        or(ilike(articles.title, pattern), ilike(articles.content, pattern))
      )
      .orderBy(desc(articles.updatedAt))
      .limit(50);

    return successResponse(results);
  } catch {
    return handleUnknownError();
  }
}
