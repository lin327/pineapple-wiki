import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  handleZodError,
  handleUnknownError,
} from "@/lib/api";
import { asc } from "drizzle-orm";

const createCategorySchema = z.object({
  name: z.string().min(1, "分类名不能为空").max(100),
  slug: z
    .string()
    .min(1, "slug 不能为空")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符"),
});

export async function GET() {
  try {
    const data = await db()
      .select()
      .from(categories)
      .orderBy(asc(categories.name));

    return successResponse(data);
  } catch {
    return handleUnknownError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.parse(body);

    const existing = await db().query.categories.findFirst({
      where: (c, { eq }) => eq(c.slug, parsed.slug),
    });
    if (existing) {
      return errorResponse("SLUG_EXISTS", "该 slug 已存在", 409);
    }

    const [category] = await db()
      .insert(categories)
      .values({ name: parsed.name, slug: parsed.slug })
      .returning();

    return successResponse(category, 201);
  } catch (error) {
    if (error instanceof z.ZodError) return handleZodError(error);
    return handleUnknownError();
  }
}
