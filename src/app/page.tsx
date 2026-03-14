import Link from "next/link";
import { ArrowRight, Ruler, Box, FileText, Palette } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPublishedProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ui/project-card";
import { HeroSection } from "@/components/sections/hero-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getPublishedProjects();
  const featured = projects.slice(0, 4);
  const t = await getTranslations("home");

  const skills = [
    { icon: Ruler, title: t("skillArchitecture"), desc: t("skillArchitectureDesc") },
    { icon: Box, title: t("skill3d"), desc: t("skill3dDesc") },
    { icon: FileText, title: t("skillDrawing"), desc: t("skillDrawingDesc") },
    { icon: Palette, title: t("skillDesign"), desc: t("skillDesignDesc") },
  ];

  return (
    <>
      <HeroSection />

      {/* Featured Projects */}
      <section
        id="featured"
        className="grid-container py-16 scroll-mt-20"
        aria-labelledby="featured-heading"
      >
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2
              id="featured-heading"
              className="text-lg md:text-xl font-semibold tracking-tight"
            >
              {t("featuredProjects")}
            </h2>
            <p className="mt-0.5 text-ink-faint text-xs">
              {t("featuredSubtitle")}
            </p>
          </div>
          <Link
            href="/portfolio"
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink transition-colors"
          >
            {t("viewAll")} <ArrowRight size={12} />
          </Link>
        </div>

        {/* Bento grid: hero card + 3 standard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((project, i) =>
            i === 0 ? (
              <div key={project.slug} className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
                <ProjectCard project={project} variant="featured" />
              </div>
            ) : (
              <ProjectCard key={project.slug} project={project} />
            )
          )}
        </div>

        <div className="mt-5 sm:hidden">
          <Link
            href="/portfolio"
            className="flex items-center gap-1 text-xs font-medium text-ink-muted"
          >
            {t("viewAllProjects")} <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* Skills Section */}
      <section className="grid-container py-16">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-6">
          {t("skillsTitle")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <div key={skill.title} className="card p-4 flex flex-col gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-surface-overlay flex items-center justify-center text-ink-muted">
                <skill.icon size={18} strokeWidth={1.5} />
              </div>
              <h3 className="text-[13px] font-semibold tracking-tight">
                {skill.title}
              </h3>
              <p className="text-[12px] text-ink-muted leading-relaxed">
                {skill.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="grid-container pb-20">
        <div className="rounded-2xl bg-ink dark:bg-surface-raised border border-border p-8 md:p-12 text-center">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-surface dark:text-ink">
            {t("ctaTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-surface/60 dark:text-ink-muted max-w-md mx-auto">
            {t("ctaSubtitle")}
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg bg-surface text-ink dark:bg-ink dark:text-surface text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            {t("ctaButton")} <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
