export { COST_GUARD } from "@/lib/onsite/config";
import { COST_GUARD } from "@/lib/onsite/config";
import type { GeocodeResult } from "@/lib/onsite/types";

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, value: T, ttlMs: number) {
    this.cache.set(key, {
      data: value,
      expires: Date.now() + ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const geocodeCache = new SimpleCache<GeocodeResult>();
const usageCounter = { count: 0, resetAt: Date.now() + 3600000 };

function parseTTL(ttl: string): number {
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (!match) return 3600000;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s": return value * 1000;
    case "m": return value * 60 * 1000;
    case "h": return value * 3600 * 1000;
    case "d": return value * 86400 * 1000;
    default: return 3600000;
  }
}

export async function cachedGeocode(
  address: string,
  geocodeFn: (addr: string) => Promise<GeocodeResult>
): Promise<GeocodeResult> {
  const cacheKey = `geocode:${address.toLowerCase().trim()}`;

  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expires > Date.now()) {
          geocodeCache.set(cacheKey, parsed.data, parseTTL(COST_GUARD.cacheTTL));
          return parsed.data;
        }
      }
    } catch (e) {
      console.warn("localStorage read failed:", e);
    }
  }

  const result = await geocodeFn(address);

  const ttlMs = parseTTL(COST_GUARD.cacheTTL);
  geocodeCache.set(cacheKey, result, ttlMs);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: result,
          expires: Date.now() + ttlMs,
        })
      );
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
  }

  incrementUsage();

  return result;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        resolve(fn(...args));
      }, delayMs);
    });
  };
}

function incrementUsage() {
  if (Date.now() > usageCounter.resetAt) {
    usageCounter.count = 0;
    usageCounter.resetAt = Date.now() + 3600000;
  }
  usageCounter.count++;
}

export function getUsageCount(): number {
  if (Date.now() > usageCounter.resetAt) {
    usageCounter.count = 0;
    usageCounter.resetAt = Date.now() + 3600000;
  }
  return usageCounter.count;
}

export function shouldWarnUsage(): boolean {
  return getUsageCount() >= COST_GUARD.perSessionWarn;
}
