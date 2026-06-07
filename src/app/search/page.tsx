import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { desc, eq, or, ilike } from "drizzle-orm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArticleList } from "@/components/ArticleList";
import { SearchBar } from "@/components/SearchBar";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q || "";
  return {
    title: q ? `Search: ${q}` : "Search",
    description: q ? `Search results for "${q}"` : "Search articles",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";

  let results: {
    id: number;
    title: string;
    slug: string;
    content: string;
    createdAt: Date | null;
    categoryName: string | null;
    categorySlug: string | null;
  }[] = [];

  if (q) {
    try {
      const pattern = `%${q}%`;
      results = await db
        .select({
          id: articles.id,
          title: articles.title,
          slug: articles.slug,
          content: articles.content,
          createdAt: articles.createdAt,
          categoryName: categories.name,
          categorySlug: categories.slug,
        })
        .from(articles)
        .leftJoin(categories, eq(articles.categoryId, categories.id))
        .where(or(ilike(articles.title, pattern), ilike(articles.content, pattern)))
        .orderBy(desc(articles.updatedAt))
        .limit(50);
    } catch {
      // Database unavailable — results stays empty
    }
  }

  const formattedArticles = results.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.content.replace(/[#*`~\[\]()]/g, "").slice(0, 150),
    category:
      a.categoryName && a.categorySlug
        ? { name: a.categoryName, slug: a.categorySlug }
        : undefined,
    date: a.createdAt?.toISOString(),
  }));

  return (
    <div className="max-w-5xl">
      <Breadcrumb items={[{ label: "Search" }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Search</h1>
      <div className="mb-6">
        <SearchBar defaultValue={q} />
      </div>

      {q ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {formattedArticles.length} result{formattedArticles.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
          </p>
          <ArticleList
            articles={formattedArticles}
            emptyMessage={`No articles found for "${q}"`}
          />
        </>
      ) : (
        <p className="text-sm text-gray-400">Enter a search query to find articles.</p>
      )}
    </div>
  );
}
