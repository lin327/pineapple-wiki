import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { desc, eq, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArticleList } from "@/components/ArticleList";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategory(slug: string) {
  try {
    const cat = await db()
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    return cat[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Not Found" };
  return {
    title: category.name,
    description: `Articles in the ${category.name} category`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const page = Math.max(1, parseInt(sp.page || "1"));
  const limit = 12;

  let formattedArticles: {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    category: { name: string; slug: string };
    date?: string;
  }[] = [];
  let totalPages = 0;

  try {
    const [{ total }] = await db()
      .select({ total: count() })
      .from(articles)
      .where(eq(articles.categoryId, category.id));
    totalPages = Math.ceil(total / limit);

    const data = await db()
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .where(eq(articles.categoryId, category.id))
      .orderBy(desc(articles.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    formattedArticles = data.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.content.replace(/[#*`~\[\]()]/g, "").slice(0, 150),
      category: { name: category.name, slug: category.slug },
      date: a.createdAt?.toISOString(),
    }));
  } catch {
    // Database unavailable — show empty state
  }

  return (
    <div className="max-w-5xl">
      <Breadcrumb items={[{ label: category.name }]} />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{category.name}</h1>
      <ArticleList
        articles={formattedArticles}
        currentPage={page}
        totalPages={totalPages}
        basePath={`/category/${slug}`}
        emptyMessage={`No articles in ${category.name} yet.`}
      />
    </div>
  );
}
