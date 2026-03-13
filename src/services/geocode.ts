/**
 * Geocoding adapter — uses MapTiler Geocoding API (key from existing env).
 * Swap provider by changing the fetch URL; interface stays the same.
 */

export interface GeocodingResult {
  label: string;
  lon: number;
  lat: number;
}

/** Simple in-memory cache (max 50 entries, 60s TTL) */
const cache = new Map<string, { ts: number; data: GeocodingResult[] }>();
const CACHE_TTL = 60_000;
const CACHE_MAX = 50;

export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const q = query.trim().toLowerCase();
  if (!key || !q) return [];

  // Check cache
  const cached = cache.get(q);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${key}&limit=5`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];

  const data = await res.json();
  const results: GeocodingResult[] = (data.features ?? []).map((f: Record<string, unknown>) => ({
    label: (f as { place_name?: string }).place_name ?? "",
    lon: (f as { center?: number[] }).center?.[0] ?? 0,
    lat: (f as { center?: number[] }).center?.[1] ?? 0,
  }));

  // Store in cache (evict oldest if full)
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(q, { ts: Date.now(), data: results });

  return results;
}
