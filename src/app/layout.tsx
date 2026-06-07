import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { ToastProvider } from "@/components/Toast";
import { db } from "@/db";
import { entities } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ops Wiki",
    template: "%s | Ops Wiki",
  },
  description: "运维知识图谱 — CMDB + 调用链 + 变更记录 + 监控告警",
};

async function getEntityCounts(): Promise<Record<string, number>> {
  try {
    const rows = await db()
      .select({ type: entities.type, cnt: count() })
      .from(entities)
      .groupBy(entities.type);
    const counts = Object.fromEntries(rows.map((r) => [r.type, Number(r.cnt)]));

    // 计算 pineapple-ops 仓库中的 YAML 文件数
    const opsDir = "/Users/pineapple/Desktop/workspace/Projects/pineapple-ops";
    let docsCount = 0;
    if (existsSync(opsDir)) {
      const countYaml = (dir: string): number => {
        let n = 0;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) {
            n += countYaml(join(dir, entry.name));
          } else if (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml")) {
            n++;
          }
        }
        return n;
      };
      docsCount = countYaml(opsDir);
    }
    counts.docs = docsCount;

    return counts;
  } catch {
    return {};
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const entityCounts = await getEntityCounts();

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900 font-sans">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar entityCounts={entityCounts} />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-3 lg:pl-6 pl-16">
                <SearchBar />
              </header>
              <main className="flex-1 p-6">{children}</main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
