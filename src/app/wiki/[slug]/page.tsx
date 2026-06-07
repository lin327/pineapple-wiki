import { db } from "@/db";
import { articles, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { TableOfContents } from "@/components/TableOfContents";
import Link from "next/link";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  try {
    const article = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        categoryId: articles.categoryId,
        isPublished: articles.isPublished,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(articles)
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .where(eq(articles.slug, slug))
      .limit(1);

    return article[0] || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not Found" };

  const description = article.content.replace(/[#*`~\[\]()]/g, "").slice(0, 160);

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  const breadcrumbItems = [];
  if (article.categoryName && article.categorySlug) {
    breadcrumbItems.push({
      label: article.categoryName,
      href: `/category/${article.categorySlug}`,
    });
  }
  breadcrumbItems.push({ label: article.title });

  const date = article.createdAt
    ? (() => {
        const d = new Date(article.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })()
    : "";

  return (
    <div className="max-w-5xl">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex gap-8">
        <article className="flex-1 min-w-0">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {article.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {date && <time dateTime={article.createdAt?.toISOString()}>{date}</time>}
              {article.categoryName && (
                <>
                  <span>·</span>
                  <Link
                    href={`/category/${article.categorySlug}`}
                    className="text-blue-600 hover:underline"
                  >
                    {article.categoryName}
                  </Link>
                </>
              )}
              <span>·</span>
              <Link
                href={`/edit/${article.slug}`}
                className="text-blue-600 hover:underline"
              >
                Edit
              </Link>
            </div>
          </header>

          <MarkdownRenderer content={article.content} />
        </article>

        <div className="hidden xl:block w-56 shrink-0">
          <TableOfContents content={article.content} />
        </div>
      </div>
    </div>
  );
}
