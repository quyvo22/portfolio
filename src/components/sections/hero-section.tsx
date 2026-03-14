"use client";

import { FadeUp } from "@/components/ui/motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("home");

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Geometric background pattern — hidden on mobile to avoid text interference */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] hidden md:block"
          style={{
            backgroundImage: `
              linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor),
              linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor),
              linear-gradient(30deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor),
              linear-gradient(150deg, currentColor 12%, transparent 12.5%, transparent 87%, currentColor 87.5%, currentColor),
              linear-gradient(60deg, rgba(128,128,128,0.3) 25%, transparent 25.5%, transparent 75%, rgba(128,128,128,0.3) 75%, rgba(128,128,128,0.3)),
              linear-gradient(60deg, rgba(128,128,128,0.3) 25%, transparent 25.5%, transparent 75%, rgba(128,128,128,0.3) 75%, rgba(128,128,128,0.3))
            `,
            backgroundSize: "80px 140px",
            backgroundPosition: "0 0, 0 0, 40px 70px, 40px 70px, 0 0, 40px 70px",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="grid-container py-16 md:py-24 lg:py-32 w-full">
        <div className="max-w-[720px]">
          <FadeUp>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-5 text-accent-700 dark:text-accent-400">
              QuyVo &mdash; {t("heroLabel")}
            </p>
          </FadeUp>

          <FadeUp delay={0.08}>
            <h1
              id="hero-heading"
              className="text-balance font-serif font-bold"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", lineHeight: "1.15" }}
            >
              {t("heroTitle")}{" "}
              <span className="relative inline-block">
                {t("heroHighlight")}
                <span
                  className="absolute left-0 bottom-[0.05em] w-full h-[0.18em] bg-accent-400/40 dark:bg-accent-500/30 -z-10 rounded-sm"
                  aria-hidden="true"
                />
              </span>
            </h1>
          </FadeUp>

          <FadeUp delay={0.16}>
            <p
              className="mt-5 text-ink-muted max-w-2xl font-medium"
              style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)", lineHeight: "1.5" }}
            >
              {t("heroSubtitle")}
            </p>
          </FadeUp>

          <FadeUp delay={0.24}>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg bg-accent-600 dark:bg-accent-500 text-white dark:text-black text-sm font-semibold hover:bg-accent-700 dark:hover:bg-accent-400 transition-colors duration-200 shadow-sm focus-visible:outline-offset-[3px]"
              >
                {t("heroCta")}
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-lg border border-border text-sm font-medium text-ink hover:bg-surface-overlay transition-colors duration-200 focus-visible:outline-offset-[3px]"
              >
                {t("heroCtaSecondary")}
              </Link>
            </div>
          </FadeUp>

          {/* Proof strip */}
          <FadeUp delay={0.32}>
            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint font-medium tracking-wide">
              <span>Revit &amp; BIM</span>
              <span aria-hidden="true" className="text-accent-500">·</span>
              <span>3D Visualization</span>
              <span aria-hidden="true" className="text-accent-500">·</span>
              <span>Technical Drawing</span>
              <span aria-hidden="true" className="text-accent-500">·</span>
              <span>Vicmap Integration</span>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* Scroll indicator — smooth anchor */}
      <a
        href="#featured"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        aria-label="Scroll to featured projects"
      >
        <ChevronDown size={24} className="text-ink-faint" />
      </a>
    </section>
  );
}
