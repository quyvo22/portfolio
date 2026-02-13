"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

function getLocaleCookie(): "vi" | "en" {
  const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
  return match?.[1] === "en" ? "en" : "vi";
}

export function LanguageToggle() {
  const [locale, setLocale] = useState<"vi" | "en">("vi");

  useEffect(() => {
    setLocale(getLocaleCookie());
  }, []);

  const toggle = () => {
    const next = locale === "vi" ? "en" : "vi";
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    setLocale(next);
    window.location.reload();
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
