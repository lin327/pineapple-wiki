import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { ArticleList } from "@/components/ArticleList";

interface PageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const limit = 12;

  let formattedArticles: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    category?: { name: string; slug: string };
    date?: string;
  }[] = [];
  let totalPages = 0;

  try {
    const [{ total }] = await db().select({ total: count() }).from(articles);
    totalPages = Math.ceil(total / limit);

    const data = await db()
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        categoryId: articles.categoryId,
        createdAt: articles.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    formattedArticles = data.map((a) => ({
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
  } catch {
    // Database unavailable — show empty state
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h1>
      <ArticleList
        articles={formattedArticles}
        currentPage={page}
        totalPages={totalPages}
        basePath="/"
        emptyMessage="暂无文章"
      />
    </div>
  );
}
