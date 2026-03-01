/**
 * In-canvas loading progress indicator.
 *
 * Migration notes:
 *   - Replaces previous LoadingFallback from fallback.tsx.
 *   - Same visual; now a standalone file for clarity.
 *   - Revert: import LoadingFallback from fallback.tsx instead.
 */

"use client";

import { Html, useProgress } from "@react-three/drei";
import { Loader2 } from "lucide-react";

export function Progress() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 text-ink-faint">
        <Loader2 size={32} className="animate-spin" />
        <p className="text-sm font-medium">{Math.round(progress)}%</p>
      </div>
    </Html>
  );
}
