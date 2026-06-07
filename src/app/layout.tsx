import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { ToastProvider } from "@/components/Toast";
import { db } from "@/db";
import { categories, tags } from "@/db/schema";
import { asc } from "drizzle-orm";

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
    default: "Wiki",
    template: "%s | Wiki",
  },
  description: "A knowledge base wiki",
};

async function getCategories() {
  try {
    return await db()
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .orderBy(asc(categories.name));
  } catch {
    return [];
  }
}

async function getTags() {
  try {
    return await db()
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .orderBy(asc(tags.name));
  } catch {
    return [];
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, tags] = await Promise.all([
    getCategories(),
    getTags(),
  ]);

  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gray-50 text-gray-900 font-sans">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar categories={categories} tags={tags} />
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
