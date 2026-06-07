import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // TODO: 后续添加登录校验逻辑，保护 /edit 等需要认证的路由
  // if (pathname.startsWith("/edit") && !isAuthenticated(request)) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  const response = NextResponse.next();
  // * 将 pathname 传递给前端，便于 Sidebar 等组件高亮当前路由
  response.headers.set("x-pathname", pathname);

  // ! 安全头 — 防止 MIME 嗅探、点击劫持、referrer 泄露等常见攻击
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

// * matcher — 排除 API 路由、静态资源和 favicon，仅对页面路由生效
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
