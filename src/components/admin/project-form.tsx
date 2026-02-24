"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";

interface ProjectFormData {
  id?: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  year: number;
  tags: string[];
  pdfUrl: string;
  modelUrl: string;
  published: boolean;
}

interface Props {
  initialData?: ProjectFormData;
  mode: "create" | "edit";
}

export function ProjectForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProjectFormData>({
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "both",
    thumbnail: initialData?.thumbnail || "",
    imageAlt: initialData?.imageAlt || "",
    imageWidth: initialData?.imageWidth || 0,
    imageHeight: initialData?.imageHeight || 0,
    year: initialData?.year || new Date().getFullYear(),
    tags: initialData?.tags || [],
    pdfUrl: initialData?.pdfUrl || "",
    modelUrl: initialData?.modelUrl || "",
    published: initialData?.published || false,
  });

  const [tagsInput, setTagsInput] = useState(form.tags.join(", "));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const body = { ...form, tags };

    try {
      const url =
        mode === "create"
          ? "/api/projects"
          : `/api/projects/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/admin/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Tiêu đề *
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Slug *
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Mô tả *
        </label>
        <textarea
          required
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Danh mục
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="both">PDF + 3D</option>
            <option value="pdf">PDF</option>
            <option value="3d">3D</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Năm
          </label>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <ImageUpload
        label="Thumbnail"
        value={form.thumbnail}
        onChange={({ url, width, height }) =>
          setForm({ ...form, thumbnail: url, imageWidth: width, imageHeight: height })
        }
      />

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Alt text (mô tả hình ảnh)
        </label>
        <input
          type="text"
          value={form.imageAlt}
          onChange={(e) => setForm({ ...form, imageAlt: e.target.value })}
          placeholder="Ví dụ: Phối cảnh mặt tiền dự án nhà phố"
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Tags (phân cách bằng dấu phẩy)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="Nhà ở, Hiện đại, Xanh"
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            PDF URL
          </label>
          <input
            type="text"
            value={form.pdfUrl}
            onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            3D Model URL
          </label>
          <input
            type="text"
            value={form.modelUrl}
            onChange={(e) => setForm({ ...form, modelUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="published"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
          className="rounded"
        />
        <label htmlFor="published" className="text-sm text-ink-muted">
          Xuất bản
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading
            ? "Đang lưu..."
            : mode === "create"
              ? "Tạo dự án"
              : "Cập nhật"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-ink-muted hover:bg-surface-overlay transition-colors"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
