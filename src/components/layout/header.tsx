"use client";

import Link from "next/link";
import Image from "next/image";
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
        "border-b border-border bg-surface/95 backdrop-blur-md",
        "transition-colors duration-300"
      )}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Row 1: Logo (centered) + mobile toggle + utility actions ── */}
        <div className="relative flex items-center justify-center py-4">
          {/* Logo — centered */}
          <Link href="/" className="flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="QuyVo"
              width={120}
              height={120}
              className="h-20 w-auto sm:h-24 dark:invert"
              priority
            />
          </Link>

          {/* Utility actions — absolute right */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
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

        {/* ── Row 2: Slogan (centered) ── */}
        <p className="text-center text-[11px] sm:text-xs tracking-[0.2em] uppercase text-ink-faint font-medium -mt-2 pb-3">
          {t("slogan")}
        </p>

        {/* ── Row 3: Navigation bar (centered, desktop) ── */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center justify-center gap-1 border-t border-border py-2"
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
                  "px-4 py-1.5 text-[13px] font-medium tracking-wide uppercase transition-colors duration-200",
                  isActive
                    ? "text-ink border-b-2 border-accent-500"
                    : "text-ink-muted hover:text-ink"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {t(link.key)}
              </Link>
            );
          })}
        </nav>

        {/* ── Mobile Nav (dropdown) ── */}
        {mobileOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden py-3 border-t border-border"
          >
            <div className="flex flex-col items-center gap-1">
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
                        "px-4 py-2 rounded-lg text-sm font-medium tracking-wide uppercase transition-colors",
                        isActive
                          ? "text-ink border-b-2 border-accent-500"
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
