import type { GeocodeResult } from "../onsite/types";
import { emit } from "../telemetry";

const geocodeCache = new Map<string, GeocodeResult>();

export async function geocodeAddress(
  address: string,
  geocoder: google.maps.Geocoder
): Promise<GeocodeResult> {
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        const result: GeocodeResult = {
          coords: { lat: loc.lat(), lng: loc.lng() },
          formatted: results[0].formatted_address,
        };
        geocodeCache.set(address, result);
        emit("geocode_success", { address, formatted: result.formatted });
        resolve(result);
      } else {
        reject(new Error(`Geocode failed: ${status}`));
      }
    });
  });
}
