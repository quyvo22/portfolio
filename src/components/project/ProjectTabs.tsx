"use client";

import { FileText } from "lucide-react";

interface ProjectTabsProps {
  slug: string;
  modelUrl: string | null;
  projectTitle: string;
}

export function ProjectTabs({ slug, modelUrl, projectTitle }: ProjectTabsProps) {
  if (!modelUrl) return null;

  return (
    <div className="mb-6 flex gap-2 border-b border-border">
      <span
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-accent border-b-2 border-accent"
      >
        <FileText size={16} />
        Viewers
      </span>
    </div>
  );
}
