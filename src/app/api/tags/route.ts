import { db } from "@/db";
import { tags } from "@/db/schema";
import { successResponse, handleUnknownError } from "@/lib/api";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db().select().from(tags).orderBy(asc(tags.name));
    return successResponse(data);
  } catch {
    return handleUnknownError();
  }
}
