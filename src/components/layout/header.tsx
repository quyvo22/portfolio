"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/portfolio", label: "Dự án" },
  { href: "/maps", label: "Maps" },
  { href: "/blog", label: "Bài viết" },
  { href: "/about", label: "Giới thiệu" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      role="banner"
      className={cn(
        "sticky top-0 z-50 w-full",
        "border-b border-border bg-surface/80 backdrop-blur-md",
        "transition-colors duration-300"
      )}
    >
      <div className="grid-container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-xl font-bold tracking-tight hover:text-accent-600 transition-colors"
          >
            Portfolio<span className="text-accent-500">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Điều hướng chính"
            className="hidden md:flex items-center gap-1"
          >
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-950/40"
                      : "text-ink-muted hover:text-ink hover:bg-surface-overlay"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />

            <Link
              href="/admin"
              className={cn(
                "hidden sm:flex items-center px-3 py-1.5 rounded-lg text-xs font-medium",
                "border border-border text-ink-muted hover:text-ink hover:bg-surface-overlay",
                "transition-colors duration-200"
              )}
            >
              Admin
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-colors"
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav
            aria-label="Điều hướng di động"
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-1">
              {[...navLinks, { href: "/admin", label: "Admin" }].map(
                (link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "text-accent-600 bg-accent-50 dark:text-accent-400 dark:bg-accent-950/40"
                          : "text-ink-muted hover:text-ink hover:bg-surface-overlay"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                }
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
