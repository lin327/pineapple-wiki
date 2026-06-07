import { NextRequest } from "next/server";
import { db } from "@/db";
import { entities } from "@/db/schema";
import { successResponse, handleUnknownError } from "@/lib/api";
import { eq, ilike, and, count, asc } from "drizzle-orm";

// GET /api/entities?type=node&search=k3s
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const conditions = [];
    if (type) conditions.push(eq(entities.type, type));
    if (search) conditions.push(ilike(entities.name, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db()
      .select()
      .from(entities)
      .where(where)
      .orderBy(asc(entities.type), asc(entities.name));

    // 按 type 分组
    const grouped: Record<string, typeof data> = {};
    for (const e of data) {
      if (!grouped[e.type]) grouped[e.type] = [];
      grouped[e.type].push(e);
    }

    return successResponse({
      entities: data,
      grouped,
      counts: Object.fromEntries(
        Object.entries(grouped).map(([k, v]) => [k, v.length])
      ),
    });
  } catch {
    return handleUnknownError();
  }
}
