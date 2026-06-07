"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
  const items: TocItem[] = headings.map((h) => {
    const level = h.startsWith("###") ? 3 : 2;
    const text = h.replace(/^#{2,3}\s+/, "");
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return { id, text, level };
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden fixed bottom-6 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Toggle table of contents"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>

      <nav
        aria-label="Table of contents"
        className={`fixed xl:sticky top-24 right-0 xl:right-auto z-40 xl:z-auto w-64 max-h-[calc(100vh-8rem)] overflow-y-auto bg-white xl:bg-transparent border-l xl:border-0 border-gray-200 p-4 xl:p-0 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"
        }`}
      >
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          On this page
        </h4>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setIsOpen(false)}
                className={`block py-1 text-sm transition-colors ${
                  item.level === 3 ? "pl-4" : "pl-0"
                } ${
                  activeId === item.id
                    ? "text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
