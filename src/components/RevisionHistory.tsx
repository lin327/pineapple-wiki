"use client";

import { useState, useEffect } from "react";

interface Revision {
  id: number;
  content: string;
  createdAt: string;
}

interface RevisionHistoryProps {
  articleSlug: string;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
}

function getExcerpt(content: string, maxLength = 120): string {
  const text = content.replace(/[#*`~\[\]()]/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function RevisionHistory({ articleSlug }: RevisionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/articles/${articleSlug}/revisions`)
      .then((res) => {
        if (!res.ok) throw new Error("获取版本历史失败");
        return res.json();
      })
      .then(({ data }) => setRevisions(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [articleSlug]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">{error}</p>
    );
  }

  if (revisions.length === 0) {
    return (
      <p className="text-sm text-gray-400">暂无版本历史</p>
    );
  }

  return (
    <div className="space-y-2">
      {revisions.map((rev) => (
        <div
          key={rev.id}
          className="border border-gray-100 rounded-lg overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === rev.id ? null : rev.id)}
            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-600">
              {formatDate(rev.createdAt)}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedId === rev.id ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          {expandedId === rev.id && (
            <div className="px-3 pb-3 pt-1">
              <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                {getExcerpt(rev.content)}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
