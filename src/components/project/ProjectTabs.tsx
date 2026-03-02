"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MapPin } from "lucide-react";

interface ProjectTabsProps {
  slug: string;
  modelUrl: string | null;
  projectTitle: string;
}

export function ProjectTabs({ slug, modelUrl, projectTitle }: ProjectTabsProps) {
  const pathname = usePathname();
  const isOnsite = pathname.includes("/onsite");

  if (!modelUrl) return null;

  return (
    <div className="mb-6 flex gap-2 border-b border-border">
      <Link
        href={`/project/${slug}`}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
          !isOnsite
            ? "text-accent border-b-2 border-accent"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <FileText size={16} />
        Viewers
      </Link>
      <Link
        href={`/project/${slug}/onsite?modelUrl=${encodeURIComponent(
          modelUrl
        )}&title=${encodeURIComponent(projectTitle)}`}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
          isOnsite
            ? "text-accent border-b-2 border-accent"
            : "text-ink-muted hover:text-ink"
        }`}
      >
        <MapPin size={16} />
        On-Site Placement
      </Link>
    </div>
  );
}
