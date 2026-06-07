import Link from "next/link";
import { formatDate } from "@/lib/date";

interface ArticleCardProps {
  title: string;
  slug: string;
  excerpt?: string;
  category?: { name: string; slug: string };
  tags?: { id: number; name: string }[];
  date?: string;
  className?: string;
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  category,
  tags,
  date,
  className = "",
}: ArticleCardProps) {
  return (
    <article
      className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        {category ? (
          <Link
            href={`/category/${category.slug}`}
            className="inline-block px-2.5 py-0.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            {category.name}
          </Link>
        ) : (
          <span />
        )}
        {date && (
          <time className="text-xs text-gray-400" dateTime={date}>
            {formatDate(date)}
          </time>
        )}
      </div>

      <Link href={`/wiki/${slug}`} className="block mb-2">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2">
          {title}
        </h3>
      </Link>

      {excerpt && (
        <p className="text-sm text-gray-500 leading-relaxed mb-3 line-clamp-2">{excerpt}</p>
      )}

      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-block px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
