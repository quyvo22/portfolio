import { geocodeAddress } from "@/lib/maps/geocode";
import { cachedGeocode, COST_GUARD } from "@/lib/maps/cost";
import type { GeocodeResult } from "@/lib/onsite/types";

export interface SearchOptions {
  debounceMs?: number;
  maxRetries?: number;
}

export function createSearch(opts: SearchOptions = {}) {
  const debounceMs = opts.debounceMs ?? COST_GUARD.geocodeDebounceMs;
  const maxRetries = opts.maxRetries ?? 2;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function searchWithBackoff(
    address: string,
    attempt = 0
  ): Promise<GeocodeResult> {
    try {
      return await cachedGeocode(address, geocodeAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429") && attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, backoffMs));
        return searchWithBackoff(address, attempt + 1);
      }
      throw err;
    }
  }

  function search(address: string): Promise<GeocodeResult> {
    return new Promise((resolve, reject) => {
      if (timer) clearTimeout(timer);

      timer = setTimeout(async () => {
        try {
          const result = await searchWithBackoff(address.trim());
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }, debounceMs);
    });
  }

  function cancel() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  return { search, cancel };
}
