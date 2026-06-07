import { NextResponse } from "next/server";
import { ZodError } from "zod";

// * API 统一响应格式 — 所有路由使用此工具函数保持响应结构一致
// * 成功格式: { success: true, data }
// * 错误格式: { success: false, error: { code, message } }

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

// * Zod 校验错误处理 — 将多个校验 issue 合并为一条可读消息
export function handleZodError(error: ZodError) {
  const message = error.issues
    .map((issue) => issue.message)
    .join("; ");
  return errorResponse("VALIDATION_ERROR", message, 400);
}

// ! 未知错误处理 — 返回通用 500 错误，避免泄露内部错误细节
export function handleUnknownError() {
  return errorResponse("INTERNAL_ERROR", "服务器内部错误", 500);
}
