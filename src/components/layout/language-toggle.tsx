"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const [locale, setLocale] = useState<"vi" | "en">("vi");

  const toggle = () => {
    const next = locale === "vi" ? "en" : "vi";
    setLocale(next);
    // Phase 2: route-based i18n switching hoàn chỉnh
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 px-2 h-9 rounded-lg text-sm font-medium",
        "text-ink-muted hover:text-ink hover:bg-surface-overlay",
        "transition-colors duration-200"
      )}
      aria-label={`Ngôn ngữ: ${locale === "vi" ? "Tiếng Việt" : "English"}. Nhấn để đổi.`}
    >
      <Globe size={16} />
      <span className="uppercase tracking-wide text-xs">{locale}</span>
    </button>
  );
}
