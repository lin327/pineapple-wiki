import { ArticleCard } from "./ArticleCard";
import { Pagination } from "./Pagination";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  category?: { name: string; slug: string };
  tags?: { id: number; name: string }[];
  date?: string;
}

interface ArticleListProps {
  articles: Article[];
  currentPage?: number;
  totalPages?: number;
  basePath?: string;
  emptyMessage?: string;
  className?: string;
}

export function ArticleList({
  articles,
  currentPage = 1,
  totalPages = 1,
  basePath = "/",
  emptyMessage = "No articles found.",
  className = "",
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
        <svg
          className="w-12 h-12 text-gray-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            title={article.title}
            slug={article.slug}
            excerpt={article.excerpt}
            category={article.category}
            tags={article.tags}
            date={article.date}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        </div>
      )}
    </div>
  );
}
