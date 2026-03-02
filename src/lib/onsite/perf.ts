export interface PerfProfile {
  lowEnd: boolean;
  fpsCap: number | null;
  lazyRender: boolean;
}

export function isMobileLowEnd(): boolean {
  if (typeof window === "undefined") return false;

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (!isMobile) return false;

  const memory = (navigator as any).deviceMemory;
  const cpuCores = navigator.hardwareConcurrency;

  if (memory && memory < 4) return true;
  if (cpuCores && cpuCores < 4) return true;

  return false;
}

export function fpsCap(target: number): number {
  return 1000 / target;
}

export function shouldLazyRender(
  lastRender: number,
  interval: number,
  isInteracting: boolean
): boolean {
  if (isInteracting) return false;
  return Date.now() - lastRender < interval;
}

export function computeLOD(distance: number, lowEnd: boolean): number {
  if (lowEnd) {
    if (distance < 50) return 2;
    if (distance < 100) return 1;
    return 0;
  }

  if (distance < 100) return 2;
  if (distance < 200) return 1;
  return 0;
}

const STORAGE_KEY = "onsite_perf_profile";

export function loadPerfProfile(): PerfProfile {
  if (typeof window === "undefined") {
    return {
      lowEnd: false,
      fpsCap: null,
      lazyRender: false,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load perf profile:", e);
  }

  return {
    lowEnd: isMobileLowEnd(),
    fpsCap: null,
    lazyRender: false,
  };
}

export function savePerfProfile(profile: PerfProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn("Failed to save perf profile:", e);
  }
}
