import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPostBySlug } from "@/lib/data";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

interface Props {
  params: { slug: string };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3099";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: "Không tìm thấy bài viết" };

  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.imageUrl || `${SITE_URL}/og-placeholder.svg`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: canonical,
      publishedTime: new Date(post.date).toISOString(),
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: post.imageWidth || 1200,
          height: post.imageHeight || 630,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const ogImage = post.imageUrl || `${SITE_URL}/og-placeholder.svg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: canonical,
    datePublished: new Date(post.date).toISOString(),
    dateModified: post.updatedAt
      ? new Date(post.updatedAt).toISOString()
      : new Date(post.date).toISOString(),
    author: {
      "@type": "Organization",
      name: "Portfolio Studio",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Portfolio Studio",
      url: SITE_URL,
    },
    image: {
      "@type": "ImageObject",
      url: ogImage,
      width: post.imageWidth || 1200,
      height: post.imageHeight || 630,
    },
    keywords: post.tags.join(", "),
  };

  return (
    <article className="grid-container py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Quay lại bài viết
      </Link>

      <header className="mb-10 max-w-3xl">
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-surface-overlay rounded-md text-xs font-medium text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1>{post.title}</h1>
        <div className="flex items-center gap-4 mt-3 text-sm text-ink-faint">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} /> {post.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {post.readingTime}
          </span>
        </div>
        <p className="mt-4 text-ink-muted text-lg leading-relaxed">
          {post.excerpt}
        </p>
      </header>

      {post.imageUrl && (
        <div className="mb-10">
          <Image
            src={post.imageUrl}
            alt={post.imageAlt || post.title}
            width={post.imageWidth || 1200}
            height={post.imageHeight || 630}
            className="w-full rounded-lg object-cover"
            priority
          />
        </div>
      )}

      <div className="max-w-3xl">
        {post.content ? (
          <div
            className="prose prose-neutral dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        ) : (
          <p className="text-ink-muted">
            Nội dung bài viết đang được cập nhật...
          </p>
        )}
      </div>
    </article>
  );
}
