"use client";

import { useState } from "react";
import type { Project } from "@/data/mock";
import { ProjectCard } from "@/components/ui/project-card";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "Tất cả" },
  { key: "pdf", label: "Bản vẽ PDF" },
  { key: "3d", label: "Mô hình 3D" },
] as const;

type FilterKey = (typeof filters)[number]["key"];

export function PortfolioFilter({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<FilterKey>("all");

  const filtered =
    active === "all"
      ? projects
      : projects.filter(
          (p) => p.category === active || p.category === "both"
        );

  return (
    <>
      <div className="flex gap-2 mb-8" role="tablist" aria-label="Lọc dự án">
        {filters.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={active === f.key}
            onClick={() => setActive(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
              active === f.key
                ? "bg-accent-500 text-white shadow-sm"
                : "text-ink-muted hover:text-ink hover:bg-surface-overlay border border-border"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((project) => (
          <StaggerItem key={project.slug}>
            <ProjectCard project={project} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {filtered.length === 0 && (
        <p className="text-center text-ink-muted py-12">
          Không tìm thấy dự án phù hợp.
        </p>
      )}
    </>
  );
}
