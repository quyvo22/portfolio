import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { FileText, Box } from "lucide-react";

const categoryLabel: Record<string, string> = {
  pdf: "PDF",
  "3d": "3D",
  both: "PDF + 3D",
};

/**
 * variant:
 *  - "default"  → standard card (image + info below)
 *  - "hero"     → full-width hero with gradient overlay (portfolio page)
 *  - "featured" → tall card with overlay (homepage bento)
 *  - "large"    → 60% wide card in mixed grid row
 */
export function ProjectCard({
  project,
  variant = "default",
}: {
  project: Project;
  variant?: "default" | "featured" | "hero" | "large";
}) {
  const Icon = project.category === "pdf" ? FileText : Box;
  const isOverlay = variant === "hero" || variant === "featured";

  const aspectClass = {
    default: "aspect-[4/3]",
    featured: "aspect-[3/4]",
    hero: "h-[400px] md:h-[480px]",
    large: "aspect-[16/10]",
  }[variant];

  const titleClass = {
    default: "text-[18px] md:text-[20px]",
    featured: "text-[15px] md:text-base",
    hero: "text-[28px] md:text-[36px]",
    large: "text-[20px] md:text-[22px]",
  }[variant];

  return (
    <Link href={`/project/${project.slug}`} className={cn("group block", variant !== "hero" && "card")}>
      {/* Image container */}
      <div className={cn("relative bg-surface-overlay overflow-hidden", aspectClass)}>
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.imageAlt || project.title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes={
              variant === "hero"
                ? "100vw"
                : variant === "large"
                  ? "(max-width: 768px) 100vw, 60vw"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            priority={variant === "hero"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint">
            <Icon size={variant === "hero" ? 64 : 40} strokeWidth={1} />
          </div>
        )}

        {/* Hero & Featured: gradient overlay with info */}
        {isOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 md:p-8">
            {/* Category chip */}
            <span className="inline-flex self-start px-2.5 py-1 rounded bg-accent-500 text-black text-[11px] font-bold uppercase tracking-wider mb-3">
              {categoryLabel[project.category] || project.category}
            </span>
            <h2 className={cn(titleClass, "font-serif font-bold leading-tight text-white")}>
              {project.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-[13px] text-white/70 font-medium">
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
        )}
      </div>

      {/* Non-overlay variants: info below image */}
      {!isOverlay && (
        <div className="p-3.5 md:p-4">
          {/* Category chip */}
          <span className="inline-flex px-2 py-0.5 rounded bg-accent-100 dark:bg-accent-950/40 text-accent-700 dark:text-accent-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            {categoryLabel[project.category] || project.category}
          </span>

          {/* Title */}
          <h3 className={cn(titleClass, "font-semibold leading-snug tracking-tight line-clamp-2 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors")}>
            {project.title}
          </h3>

          {/* Meta: year · type */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[13px] text-ink-muted font-medium">
            <span>{project.year}</span>
            <span aria-hidden="true">·</span>
            <span>{categoryLabel[project.category] || project.category}</span>
          </div>
        </div>
      )}
    </Link>
  );
}
