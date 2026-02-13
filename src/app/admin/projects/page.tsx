import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllProjects } from "@/lib/data";
import { DeleteProjectButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const projects = await getAllProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl">Quản lý dự án</h1>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Tạo mới
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-ink-muted py-8">Chưa có dự án nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="pb-3 font-medium">Tiêu đề</th>
                <th className="pb-3 font-medium">Slug</th>
                <th className="pb-3 font-medium">Danh mục</th>
                <th className="pb-3 font-medium">Năm</th>
                <th className="pb-3 font-medium">Trạng thái</th>
                <th className="pb-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-border/50 hover:bg-surface-overlay/50"
                >
                  <td className="py-3 font-medium">{project.title}</td>
                  <td className="py-3 text-ink-muted">{project.slug}</td>
                  <td className="py-3 text-ink-muted">{project.category}</td>
                  <td className="py-3 text-ink-muted">{project.year}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        project.published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {project.published ? "Xuất bản" : "Nháp"}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="px-3 py-1 rounded-md text-xs font-medium border border-border text-ink-muted hover:bg-surface-overlay transition-colors"
                      >
                        Sửa
                      </Link>
                      <DeleteProjectButton id={project.id} title={project.title} />
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
