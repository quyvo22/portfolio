/**
 * Detect low-end device for quality reduction.
 *
 * Migration notes:
 *   - Only active when FLAGS.LOW_END_PROFILE = true.
 *   - Returns `isLowEnd: false` otherwise → no behaviour change.
 *   - Revert: set FLAGS.LOW_END_PROFILE = false.
 */

"use client";

import { useState, useEffect } from "react";
import { FLAGS, LOW_END, MOBILE_BREAKPOINT } from "@/lib/3d-config";

export interface LowEndProfile {
  isLowEnd: boolean;
  maxDpr: number;
  disableShadows: boolean;
  disableAntialias: boolean;
  envResolution: number;
}

const DEFAULT_PROFILE: LowEndProfile = {
  isLowEnd: false,
  maxDpr: 2,
  disableShadows: false,
  disableAntialias: false,
  envResolution: 256,
};

export function useLowEndProfile(): LowEndProfile {
  const [profile, setProfile] = useState<LowEndProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    if (!FLAGS.LOW_END_PROFILE) return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
    const isLowEnd = isMobile || cores <= 4 || mem <= 4;

    if (isLowEnd) {
      setProfile({
        isLowEnd: true,
        maxDpr: LOW_END.maxDpr,
        disableShadows: LOW_END.disableShadows,
        disableAntialias: LOW_END.disableAntialias,
        envResolution: LOW_END.envResolution,
      });
    }
  }, []);

  return profile;
}
