import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid-container py-20 text-center">
      <h1 className="text-6xl font-bold text-ink-faint">404</h1>
      <p className="mt-4 text-lg text-ink-muted">
        Trang bạn tìm kiếm không tồn tại.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
      >
        Về trang chủ
      </Link>
    </section>
  );
}
