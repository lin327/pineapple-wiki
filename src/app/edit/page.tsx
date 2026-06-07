"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor";

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [articleId, setArticleId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (!articleId) setSlug(generateSlug(value));
  };

  const handleSave = useCallback(
    async (content: string) => {
      if (!title.trim() || !slug.trim()) {
        setError("标题和 slug 不能为空");
        return;
      }
      setError("");
      setCreating(true);
      try {
        if (articleId) {
          // Update existing
          const res = await fetch(`/api/articles/${slug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error?.message || "保存失败");
          }
        } else {
          // Create new
          const res = await fetch("/api/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, slug, content }),
          });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error?.message || "创建失败");
          }
          const { data } = await res.json();
          setArticleId(data.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      } finally {
        setCreating(false);
      }
    },
    [title, slug, articleId]
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text">新建文章</h1>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 text-sm text-text-secondary hover:text-text border border-border rounded-lg hover:bg-white transition-colors"
        >
          返回
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-error text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            标题
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="输入文章标题"
            className="w-full px-4 py-2.5 text-lg border-0 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-shadow"
          />
        </div>
        <div>
          <label
            htmlFor="slug"
            className="block text-sm font-medium text-text-secondary mb-1"
          >
            Slug
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="article-url-slug"
            className="w-full px-4 py-2 text-sm border-0 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-shadow font-mono"
          />
        </div>
      </div>

      <ArticleEditor onSave={handleSave} autoSaveInterval={30000} />
    </div>
  );
}
