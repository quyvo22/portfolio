"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageToggle } from "./language-toggle";

const navKeys = [
  { href: "/", key: "home" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/maps", key: "maps" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");
  const tc = useTranslations("common");

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
            QuyVo<span className="text-accent-500">.</span>
          </Link>

          {/* Desktop Nav */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1"
          >
            {navKeys.map((link) => {
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
                  {t(link.key)}
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
              {t("admin")}
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-overlay transition-colors"
              aria-label={mobileOpen ? tc("closeMenu") : tc("openMenu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden py-4 border-t border-border"
          >
            <div className="flex flex-col gap-1">
              {[...navKeys, { href: "/admin" as const, key: "admin" as const }].map(
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
                      {t(link.key)}
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
