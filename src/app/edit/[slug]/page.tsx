"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArticleEditor } from "@/components/ArticleEditor";

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`/api/articles/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("文章不存在");
        return res.json();
      })
      .then(({ data }) => {
        setArticle(data);
        setTitle(data.title);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = useCallback(
    async (content: string) => {
      if (!article) return;
      setError("");
      try {
        const res = await fetch(`/api/articles/${slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error?.message || "保存失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存失败");
      }
    },
    [article, slug, title]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-96 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm text-primary hover:underline"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text">编辑文章</h1>
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

      <div className="mb-6">
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
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 text-lg border-0 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:ring-offset-1 outline-none transition-shadow"
        />
      </div>

      {article && (
        <ArticleEditor
          initialContent={article.content}
          onSave={handleSave}
          autoSaveInterval={30000}
        />
      )}
    </div>
  );
}
