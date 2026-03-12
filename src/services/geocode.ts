/**
 * Geocoding adapter — uses MapTiler Geocoding API (key from existing env).
 * Swap provider by changing the fetch URL; interface stays the same.
 */

export interface GeocodingResult {
  label: string;
  lon: number;
  lat: number;
}

export async function geocode(
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  if (!key || !query.trim()) return [];

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query.trim())}.json?key=${key}&limit=5`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.features ?? []).map((f: Record<string, unknown>) => ({
    label: (f as { place_name?: string }).place_name ?? "",
    lon: (f as { center?: number[] }).center?.[0] ?? 0,
    lat: (f as { center?: number[] }).center?.[1] ?? 0,
  }));
}
