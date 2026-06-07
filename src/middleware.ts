import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 预留：后续可在此添加登录校验
  // if (pathname.startsWith("/edit") && !isAuthenticated(request)) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // 安全头
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
