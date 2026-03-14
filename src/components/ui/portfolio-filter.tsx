"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types";
import { useTranslations } from "next-intl";
import { ProjectCard } from "@/components/ui/project-card";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";
import { FileText, Box } from "lucide-react";

const filterKeys = ["all", "pdf", "3d"] as const;
type FilterKey = (typeof filterKeys)[number];
type SortKey = "newest" | "oldest";

const categoryLabel: Record<string, string> = {
  pdf: "PDF",
  "3d": "3D",
  both: "PDF + 3D",
};

/* ──────────────────────────────
   Hero Banner (featured / latest)
   ────────────────────────────── */
function HeroBanner({ project }: { project: Project }) {
  const Icon = project.category === "pdf" ? FileText : Box;

  return (
    <Link
      href={`/project/${project.slug}`}
      className="group block relative w-full h-[400px] md:h-[480px] rounded-2xl overflow-hidden mb-8"
    >
      {project.thumbnail ? (
        <Image
          src={project.thumbnail}
          alt={project.imageAlt || project.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          sizes="100vw"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-surface-overlay flex items-center justify-center text-ink-faint">
          <Icon size={64} strokeWidth={1} />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col">
        <span className="inline-flex self-start px-2.5 py-1 rounded bg-accent-500 text-black text-[11px] font-bold uppercase tracking-wider mb-3">
          {categoryLabel[project.category] || project.category}
        </span>
        <h2 className="text-[28px] md:text-[36px] font-serif font-bold leading-tight text-white max-w-2xl">
          {project.title}
        </h2>
        <div className="flex items-center gap-2 mt-2.5 text-[14px] text-white/70 font-medium">
          <span>QuyVo</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
          {project.tags[0] && (
            <>
              <span aria-hidden="true">·</span>
              <span>{project.tags[0]}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ──────────────────────────────
   Sidebar (desktop only)
   ────────────────────────────── */
function Sidebar({
  projects,
  allTags,
}: {
  projects: Project[];
  allTags: string[];
}) {
  const t = useTranslations("portfolio");
  const latest = projects.slice(0, 3);

  return (
    <aside className="space-y-8">
      {/* Latest projects */}
      <div>
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint mb-4">
          {t("latestProjects")}
        </h3>
        <div className="space-y-4">
          {latest.map((p) => (
            <Link
              key={p.slug}
              href={`/project/${p.slug}`}
              className="group flex gap-3 items-start"
            >
              <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-surface-overlay flex-shrink-0">
                {p.thumbnail ? (
                  <Image
                    src={p.thumbnail}
                    alt={p.imageAlt || p.title}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-ink-faint">
                    <Box size={16} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-medium leading-snug line-clamp-2 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
                  {p.title}
                </p>
                <p className="text-[12px] text-ink-faint mt-0.5">{p.year}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular tags */}
      {allTags.length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint mb-4">
            {t("popularTags")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 12).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-surface-overlay text-[12px] text-ink-muted font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ──────────────────────────────
   Mixed Grid — ArchDaily pattern
   Row A: 60% + 40%
   Row B: 33% + 33% + 33%
   Repeats
   ────────────────────────────── */
function MixedGrid({ projects }: { projects: Project[] }) {
  const rows: JSX.Element[] = [];
  let i = 0;

  while (i < projects.length) {
    const rowIndex = rows.length;
    const isWideRow = rowIndex % 2 === 0;

    if (isWideRow) {
      // Row A: 1 large (60%) + 1 normal (40%)
      const a = projects[i];
      const b = projects[i + 1];
      rows.push(
        <div key={`row-${rowIndex}`} className="grid grid-cols-1 md:grid-cols-5 gap-5">
          <StaggerItem className="md:col-span-3">
            <ProjectCard project={a} variant="large" />
          </StaggerItem>
          {b && (
            <StaggerItem className="md:col-span-2">
              <ProjectCard project={b} />
            </StaggerItem>
          )}
        </div>
      );
      i += 2;
    } else {
      // Row B: up to 3 equal cards
      const chunk = projects.slice(i, i + 3);
      rows.push(
        <div key={`row-${rowIndex}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {chunk.map((p) => (
            <StaggerItem key={p.slug}>
              <ProjectCard project={p} />
            </StaggerItem>
          ))}
        </div>
      );
      i += chunk.length;
    }
  }

  return <StaggerContainer className="space-y-5">{rows}</StaggerContainer>;
}

/* ──────────────────────────────
   Main Export
   ────────────────────────────── */
export function PortfolioFilter({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const t = useTranslations("portfolio");

  const filterLabels: Record<FilterKey, string> = {
    all: t("filterAll"),
    pdf: t("filterPdf"),
    "3d": t("filter3d"),
  };

  // All unique tags sorted by frequency
  const allTags = useMemo(() => {
    const count: Record<string, number> = {};
    projects.forEach((p) => p.tags.forEach((tag) => (count[tag] = (count[tag] || 0) + 1)));
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [projects]);

  const filtered = useMemo(() => {
    let result =
      active === "all"
        ? projects
        : projects.filter((p) => p.category === active || p.category === "both");

    result = [...result].sort((a, b) =>
      sort === "newest" ? b.year - a.year : a.year - b.year
    );
    return result;
  }, [projects, active, sort]);

  // Featured = first project (latest)
  const heroProject = projects[0];
  const gridProjects = filtered.filter((p) => p.slug !== heroProject?.slug);

  return (
    <>
      {/* Hero Banner */}
      {heroProject && <HeroBanner project={heroProject} />}

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 border-b border-border pb-4">
        <div className="flex items-center gap-1" role="tablist" aria-label="Filter projects">
          {filterKeys.map((key) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              onClick={() => setActive(key)}
              className={cn(
                "px-4 py-2 text-[16px] font-medium transition-all duration-200 border-b-2",
                active === key
                  ? "border-accent-500 text-ink"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-ink-faint"
              )}
            >
              {filterLabels[key]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(["newest", "oldest"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-200",
                sort === key
                  ? "bg-surface-overlay text-ink"
                  : "text-ink-faint hover:text-ink"
              )}
            >
              {t(key === "newest" ? "sortNewest" : "sortOldest")}
            </button>
          ))}
        </div>
      </div>

      {/* Main content: Grid + Sidebar */}
      <div className="flex gap-8">
        {/* Grid — takes remaining space */}
        <div className="flex-1 min-w-0">
          {gridProjects.length > 0 ? (
            <MixedGrid projects={gridProjects} />
          ) : (
            <p className="text-center text-ink-muted py-16 text-[16px]">
              {t("noResults")}
            </p>
          )}
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden xl:block w-[280px] flex-shrink-0">
          <Sidebar projects={projects} allTags={allTags} />
        </div>
      </div>
    </>
  );
}
