"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

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
              QuyVo<span className="text-accent-500">.</span>
            </Link>
            <p className="mt-3 text-sm text-ink-muted leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Navigation */}
          <div className="col-span-4 sm:col-span-2 lg:col-span-2 lg:col-start-7">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-ink-faint mb-3">
              {t("navigation")}
            </h4>
            <ul className="space-y-2 text-sm">
              {(["portfolio", "blog", "about"] as const).map((key) => (
                <li key={key}>
                  <Link
                    href={key === "about" ? "/about" : `/${key}`}
                    className="text-ink-muted hover:text-ink transition-colors"
                  >
                    {tn(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-4 sm:col-span-2 lg:col-span-3 lg:col-start-10">
            <h4 className="text-xs font-sans font-semibold uppercase tracking-widest text-ink-faint mb-3">
              {t("contact")}
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>hello@quyvo.dev</li>
              <li>{t("location")}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ink-faint">
          <span>{t("copyright")}</span>
          <span>{t("builtWith")}</span>
        </div>
      </div>
    </footer>
  );
}
