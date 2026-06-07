"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Category {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

interface Tag {
  id: number;
  name: string;
}

interface SidebarProps {
  categories: Category[];
  tags: Tag[];
  activeCategorySlug?: string;
  activeTag?: string;
  className?: string;
}

export function Sidebar({
  categories,
  tags,
  activeCategorySlug,
  activeTag,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`w-64 shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-fit ${className}`}
    >
      <nav aria-label="Categories">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Categories</h2>
        <ul className="space-y-1">
          {categories.map((cat) => {
            const isActive = activeCategorySlug === cat.slug;
            return (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                  {cat.count !== undefined && (
                    <span className="ml-auto text-xs text-gray-400">{cat.count}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tags.length > 0 && (
        <div className="mt-6 pt-5 border-t border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = activeTag === tag.name;
              return (
                <Link
                  key={tag.id}
                  href={`/search?q=${encodeURIComponent(tag.name)}`}
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {tag.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
