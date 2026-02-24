import Link from "next/link";

export function Footer() {
  return (
    <footer
      role="contentinfo"
      className="border-t border-border bg-surface mt-20"
    >
      <div className="grid-container py-12">
        <div className="grid-12">
          {/* Brand */}
          <div className="col-span-4 sm:col-span-4 lg:col-span-4">
            <Link
              href="/"
              className="font-serif text-lg font-bold tracking-tight"
            >
              Portfolio<span className="text-accent-500">.</span>
            </Link>
            <p className="mt-3 text-sm text-ink-muted leading-relaxed">
              Kiến trúc. Kỹ thuật. Đổi mới.
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-4 sm:col-span-2 lg:col-span-2 lg:col-start-7">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-ink-faint mb-3">
              Điều hướng
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/portfolio", label: "Dự án" },
                { href: "/blog", label: "Bài viết" },
                { href: "/about", label: "Về chúng tôi" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-ink-muted hover:text-ink transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-4 sm:col-span-2 lg:col-span-3 lg:col-start-10">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-ink-faint mb-3">
              Liên hệ
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>hello@portfolio.studio</li>
              <li>TP. Hồ Chí Minh, Việt Nam</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ink-faint">
          <span>© 2026 Portfolio Studio. Mọi quyền được bảo lưu.</span>
          <span>Xây dựng với Next.js & TypeScript</span>
        </div>
      </div>
    </footer>
  );
}
