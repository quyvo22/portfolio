import { Lock } from "lucide-react";

// Metadata is defined in admin/layout.tsx

export default function AdminPage() {
  return (
    <section className="grid-container py-20">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-overlay flex items-center justify-center mb-6">
          <Lock size={28} className="text-ink-faint" />
        </div>

        <h1 className="text-2xl md:text-3xl">Quản trị</h1>
        <p className="mt-3 text-ink-muted">
          Vui lòng đăng nhập để truy cập trang quản trị.
        </p>

        <button
          disabled
          className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium opacity-60 cursor-not-allowed"
        >
          Đăng nhập
        </button>

        <p className="mt-4 text-xs text-ink-faint">
          Đăng nhập bằng Google hoặc Email Magic Link.
        </p>
      </div>
    </section>
  );
}
