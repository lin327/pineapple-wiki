"use client";

import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
  className?: string;
}

function getPageRange(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}

function buildUrl(basePath: string, page: number): string {
  const url = new URL(basePath, "http://localhost");
  url.searchParams.set("page", String(page));
  return url.pathname + url.search;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath = "/",
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1 ${className}`}>
      {currentPage > 1 ? (
        <Link
          href={buildUrl(basePath, currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Prev
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-300 bg-white border border-gray-100 rounded-lg cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Prev
        </span>
      )}

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            ...
          </span>
        ) : page === currentPage ? (
          <span
            key={page}
            aria-current="page"
            className="inline-flex items-center justify-center w-9 h-9 text-sm font-medium text-white bg-blue-600 rounded-lg"
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={buildUrl(basePath, page)}
            className="inline-flex items-center justify-center w-9 h-9 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            aria-label={`Page ${page}`}
          >
            {page}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={buildUrl(basePath, currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          aria-label="Next page"
        >
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-300 bg-white border border-gray-100 rounded-lg cursor-not-allowed">
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </span>
      )}
    </nav>
  );
}
