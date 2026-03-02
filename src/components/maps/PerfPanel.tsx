"use client";

import { useState, useEffect } from "react";
import { loadPerfProfile, savePerfProfile, type PerfProfile } from "@/lib/onsite/perf";

interface PerfPanelProps {
  onChange?: (profile: PerfProfile) => void;
}

export function PerfPanel({ onChange }: PerfPanelProps) {
  const [profile, setProfile] = useState<PerfProfile>(loadPerfProfile());

  useEffect(() => {
    savePerfProfile(profile);
    onChange?.(profile);
  }, [profile, onChange]);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        Performance
      </h3>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={profile.lowEnd}
          onChange={(e) =>
            setProfile((p) => ({ ...p, lowEnd: e.target.checked }))
          }
          className="rounded"
        />
        <span>Low-end mode</span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={profile.lazyRender}
          onChange={(e) =>
            setProfile((p) => ({ ...p, lazyRender: e.target.checked }))
          }
          className="rounded"
        />
        <span>Lazy render</span>
      </label>

      <div className="space-y-1">
        <label className="text-xs text-gray-600">FPS Cap</label>
        <select
          value={profile.fpsCap || "none"}
          onChange={(e) =>
            setProfile((p) => ({
              ...p,
              fpsCap: e.target.value === "none" ? null : Number(e.target.value),
            }))
          }
          className="w-full text-sm rounded border border-gray-300 px-2 py-1"
        >
          <option value="none">None</option>
          <option value="30">30 FPS</option>
          <option value="60">60 FPS</option>
        </select>
      </div>
    </div>
  );
}
