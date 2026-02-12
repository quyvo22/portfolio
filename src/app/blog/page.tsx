import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/data/mock";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Bài viết",
  description:
    "Chia sẻ kiến thức, kinh nghiệm và góc nhìn về thiết kế & kiến trúc.",
};

export default function BlogPage() {
  return (
    <section className="grid-container py-16">
      <div className="mb-10">
        <h1>Bài viết</h1>
        <p className="mt-2 text-ink-muted max-w-xl">
          Chia sẻ kiến thức, kinh nghiệm và góc nhìn về thiết kế & kiến trúc.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post) => (
          <article key={post.slug} className="card group">
            <div className="aspect-[16/9] bg-surface-overlay flex items-center justify-center text-ink-faint text-xs">
              Hình minh họa
            </div>

            <div className="p-5">
              <div className="flex items-center gap-3 text-xs text-ink-faint mb-3">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} /> {post.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} /> {post.readingTime}
                </span>
              </div>

              <h3 className="text-lg font-serif font-semibold leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                {post.title}
              </h3>

              <p className="mt-2 text-sm text-ink-muted line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-surface-overlay rounded-md text-[11px] text-ink-muted font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-600 dark:text-accent-400 hover:underline underline-offset-4"
              >
                Đọc tiếp <ArrowRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
