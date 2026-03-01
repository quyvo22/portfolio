import Link from "next/link";
import Image from "next/image";
import type { Project } from "@/types";
import { cn } from "@/lib/utils";
import { FileText, Box } from "lucide-react";

const categoryIcon: Record<string, typeof FileText> = { pdf: FileText, "3d": Box, both: Box };
const categoryLabel: Record<string, string> = { pdf: "PDF", "3d": "3D", both: "PDF + 3D" };

export function ProjectCard({ project }: { project: Project }) {
  const Icon = categoryIcon[project.category] || Box;

  return (
    <Link href={`/project/${project.slug}`} className="group card block">
      <div className="relative aspect-[4/3] bg-surface-overlay flex items-center justify-center overflow-hidden">
        {project.thumbnail ? (
          <Image
            src={project.thumbnail}
            alt={project.imageAlt || project.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="text-ink-faint">
            <Icon size={40} strokeWidth={1} />
          </div>
        )}
        <span
          className={cn(
            "absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
            "bg-accent-500/90 text-white"
          )}
        >
          {categoryLabel[project.category] || project.category}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs text-ink-faint font-medium mb-1">
          {project.year}
        </p>
        <h3 className="text-base font-serif font-semibold leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
          {project.title}
        </h3>
        <p className="mt-1.5 text-sm text-ink-muted line-clamp-2 leading-relaxed">
          {project.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-surface-overlay rounded-md text-[11px] text-ink-muted font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
