"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";

interface PostFormData {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readingTime: string;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  published: boolean;
}

interface Props {
  initialData?: PostFormData;
  mode: "create" | "edit";
}

export function PostForm({ initialData, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<PostFormData>({
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    readingTime: initialData?.readingTime || "5 phút",
    tags: initialData?.tags || [],
    imageUrl: initialData?.imageUrl || "",
    imageAlt: initialData?.imageAlt || "",
    imageWidth: initialData?.imageWidth || 0,
    imageHeight: initialData?.imageHeight || 0,
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
        mode === "create" ? "/api/posts" : `/api/posts/${initialData?.id}`;
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

      router.push("/admin/posts");
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
          Tóm tắt *
        </label>
        <textarea
          required
          rows={2}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Nội dung
        </label>
        <textarea
          rows={10}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent font-mono"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Ngày đăng
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1">
            Thời gian đọc
          </label>
          <input
            type="text"
            value={form.readingTime}
            onChange={(e) => setForm({ ...form, readingTime: e.target.value })}
            placeholder="5 phút"
            className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1">
          Tags (phân cách bằng dấu phẩy)
        </label>
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="BIM, Workflow"
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <ImageUpload
        label="Ảnh bìa bài viết"
        value={form.imageUrl}
        onChange={({ url, width, height }) =>
          setForm({ ...form, imageUrl: url, imageWidth: width, imageHeight: height })
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
          placeholder="Ví dụ: Sơ đồ quy trình BIM"
          className="w-full px-3 py-2 rounded-lg bg-surface-overlay border border-border text-ink text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
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
              ? "Tạo bài viết"
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
