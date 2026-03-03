import type { Coords, ElevationResult } from "../onsite/types";
import { emit } from "../telemetry";

export async function getElevation(
  coords: Coords
): Promise<ElevationResult> {
  const url = new URL("https://api.open-meteo.com/v1/elevation");
  url.searchParams.set("latitude", coords.lat.toString());
  url.searchParams.set("longitude", coords.lng.toString());

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Elevation failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.elevation?.length) {
    throw new Error("Elevation failed: no data");
  }

  const result: ElevationResult = {
    elevation: data.elevation[0],
    location: { lat: coords.lat, lng: coords.lng },
  };

  emit("elevation_fetch", { elevation: result.elevation });
  return result;
}
