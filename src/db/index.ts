import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// * 数据库单例 — 延迟初始化，避免在模块加载时就连接数据库
// * 使用 neon-http 驱动（无状态 HTTP 请求），适合 Serverless/Edge 环境
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function db() {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    // ! DATABASE_URL 未设置时直接抛错，阻止无数据库连接运行
    if (!url) {
      throw new Error("DATABASE_URL is not set");
    }
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
