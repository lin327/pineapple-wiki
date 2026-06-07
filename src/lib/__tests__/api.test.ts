import { describe, it, expect } from "vitest";
import { successResponse, errorResponse, handleZodError, handleUnknownError } from "../api";
import { ZodError } from "zod";

describe("successResponse", () => {
  it("returns 200 with success envelope by default", async () => {
    const res = successResponse({ id: 1 });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ success: true, data: { id: 1 } });
  });

  it("supports custom status code", async () => {
    const res = successResponse({ id: 1 }, 201);
    expect(res.status).toBe(201);
  });
});

describe("errorResponse", () => {
  it("returns 400 with error envelope by default", async () => {
    const res = errorResponse("VALIDATION_ERROR", "bad input");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "bad input" },
    });
  });

  it("supports custom status code", async () => {
    const res = errorResponse("NOT_FOUND", "missing", 404);
    expect(res.status).toBe(404);
  });
});

describe("handleZodError", () => {
  it("joins issue messages into a single string", () => {
    const zodError = new ZodError([
      { code: "too_small", minimum: 1, type: "string", inclusive: true, path: ["title"], message: "标题不能为空" },
      { code: "too_small", minimum: 1, type: "string", inclusive: true, path: ["slug"], message: "slug 不能为空" },
    ]);

    const res = handleZodError(zodError);
    expect(res.status).toBe(400);
  });
});

describe("handleUnknownError", () => {
  it("returns 500 with generic message", async () => {
    const res = handleUnknownError();
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
