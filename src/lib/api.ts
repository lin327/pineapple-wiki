import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export function handleZodError(error: ZodError) {
  const message = error.issues
    .map((issue) => issue.message)
    .join("; ");
  return errorResponse("VALIDATION_ERROR", message, 400);
}

export function handleUnknownError() {
  return errorResponse("INTERNAL_ERROR", "服务器内部错误", 500);
}
