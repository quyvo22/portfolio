"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Map } from "lucide-react";
import { cn } from "@/lib/utils";

const MapViewer = dynamic(
  () => import("@/components/MapViewer").then((m) => m.MapViewer),
  { ssr: false },
);

interface ProjectTabsProps {
  slug: string;
  modelUrl: string | null;
  projectTitle: string;
  /** The "Viewers" content rendered by the parent (server component) */
  children: React.ReactNode;
}

type Tab = "viewers" | "maps";

export function ProjectTabs({
  modelUrl,
  children,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("viewers");
  const hasModel = !!modelUrl;

  return (
    <>
      {/* ── Tab bar ── */}
      <div className="mb-6 flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("viewers")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "viewers"
              ? "text-accent border-b-2 border-accent"
              : "text-ink-muted hover:text-ink",
          )}
        >
          <FileText size={16} />
          Viewers
        </button>

        {hasModel && (
          <button
            onClick={() => setActiveTab("maps")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "maps"
                ? "text-accent border-b-2 border-accent"
                : "text-ink-muted hover:text-ink",
            )}
          >
            <Map size={16} />
            Maps
          </button>
        )}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "viewers" && children}

      {activeTab === "maps" && hasModel && (
        <>
          {/* MapTiler CSS */}
          <link
            rel="stylesheet"
            href="https://cdn.maptiler.com/maptiler-sdk-js/v3.11.1/maptiler-sdk.css"
          />
          <div className="h-[calc(100vh-16rem)] min-h-[500px] rounded-xl overflow-hidden border border-border">
            <MapViewer modelUrl={modelUrl!} />
          </div>
        </>
      )}
    </>
  );
}
