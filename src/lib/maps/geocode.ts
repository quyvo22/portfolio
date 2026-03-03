import type { GeocodeResult } from "../onsite/types";
import { emit } from "../telemetry";

const geocodeCache = new Map<string, GeocodeResult>();

export async function geocodeAddress(
  address: string
): Promise<GeocodeResult> {
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "PortfolioApp/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Geocode failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.length) {
    throw new Error("Geocode failed: ZERO_RESULTS");
  }

  const result: GeocodeResult = {
    coords: { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) },
    formatted: data[0].display_name,
  };

  geocodeCache.set(address, result);
  emit("geocode_success", { address, formatted: result.formatted });
  return result;
}
