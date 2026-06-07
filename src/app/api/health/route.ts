import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Simple health check - you can add database connectivity check here
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Health check failed" },
      { status: 500 }
    );
  }
}