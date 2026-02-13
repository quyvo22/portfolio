"use client";

import { FadeUp } from "@/components/ui/motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="grid-container py-20 md:py-28 lg:py-36"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-3xl">
        <FadeUp>
          <p className="text-sm font-medium text-accent-600 dark:text-accent-400 tracking-wide uppercase mb-4">
            Architecture Portfolio
          </p>
        </FadeUp>

        <FadeUp delay={0.08}>
          <h1 id="hero-heading" className="text-balance">
            Thiết kế &{" "}
            <span className="text-accent-500">Sáng tạo</span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.16}>
          <p className="mt-5 text-lg md:text-xl text-ink-muted max-w-2xl leading-relaxed">
            Portfolio kiến trúc — nơi trưng bày các dự án PDF & 3D với trải
            nghiệm tương tác đầy đủ.
          </p>
        </FadeUp>

        <FadeUp delay={0.24}>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors duration-200 shadow-sm"
            >
              Xem dự án <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-ink hover:bg-surface-overlay transition-colors duration-200"
            >
              Giới thiệu
            </Link>
          </div>
        </FadeUp>

        <FadeUp delay={0.32}>
          <div className="mt-16 h-px bg-gradient-to-r from-accent-300 via-accent-500/40 to-transparent dark:from-accent-700 dark:via-accent-500/20" />
        </FadeUp>
      </div>
    </section>
  );
}
