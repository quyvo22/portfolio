import Link from "next/link";
import { FolderOpen, FileText, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [projectCount, postCount, publishedProjects, publishedPosts] =
    await Promise.all([
      prisma.project.count(),
      prisma.blogPost.count(),
      prisma.project.count({ where: { published: true } }),
      prisma.blogPost.count({ where: { published: true } }),
    ]);

  const stats = [
    {
      label: "Dự án",
      total: projectCount,
      published: publishedProjects,
      icon: FolderOpen,
      href: "/admin/projects",
    },
    {
      label: "Bài viết",
      total: postCount,
      published: publishedPosts,
      icon: FileText,
      href: "/admin/posts",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-surface-overlay flex items-center justify-center shrink-0">
              <stat.icon size={20} className="text-ink-muted" />
            </div>
            <div>
              <p className="text-sm text-ink-muted">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.total}</p>
              <p className="text-xs text-ink-faint">
                {stat.published} xuất bản
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Dự án mới
        </Link>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-ink-muted hover:bg-surface-overlay transition-colors"
        >
          <Plus size={16} /> Bài viết mới
        </Link>
      </div>
    </div>
  );
}
