import { NextRequest } from "next/server";
import { db } from "@/db";
import { changes } from "@/db/schema";
import { successResponse, handleUnknownError } from "@/lib/api";
import { desc, eq, count } from "drizzle-orm";

// GET /api/changes?limit=20&severity=critical
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const severity = searchParams.get("severity");

    const where = severity ? eq(changes.severity, severity) : undefined;

    const [{ total }] = await db()
      .select({ total: count() })
      .from(changes)
      .where(where);

    const data = await db()
      .select()
      .from(changes)
      .where(where)
      .orderBy(desc(changes.createdAt))
      .limit(limit);

    return successResponse({ changes: data, total });
  } catch {
    return handleUnknownError();
  }
}
