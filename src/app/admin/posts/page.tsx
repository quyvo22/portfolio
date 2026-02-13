import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllPosts } from "@/lib/data";
import { DeletePostButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">Quản lý bài viết</h1>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Tạo mới
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="text-ink-muted py-8">Chưa có bài viết nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="pb-3 font-medium">Tiêu đề</th>
                <th className="pb-3 font-medium">Slug</th>
                <th className="pb-3 font-medium">Ngày</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-border/50 hover:bg-surface-overlay/50"
                >
                  <td className="py-3 font-medium">{post.title}</td>
                  <td className="py-3 text-ink-muted">{post.slug}</td>
                  <td className="py-3 text-ink-muted">{post.date}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        post.published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {post.published ? "Xuất bản" : "Nháp"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/posts/${post.id}/edit`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-border text-ink-muted hover:bg-surface-overlay transition-colors"
                      >
                        Sửa
                      </Link>
                      <DeletePostButton id={post.id} title={post.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
