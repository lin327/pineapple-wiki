import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { SearchBar } from "@/components/SearchBar";
import { ToastProvider } from "@/components/Toast";

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

async function fetchCategories() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/categories`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function fetchTags() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/tags`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.success ? data.data : [];
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
    fetchCategories(),
    fetchTags(),
  ]);

  return (
    <html
      lang="en"
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
