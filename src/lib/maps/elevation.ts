import type { Coords, ElevationResult } from "../onsite/types";
import { emit } from "../telemetry";

export async function getElevation(
  coords: Coords,
  elevator: google.maps.ElevationService
): Promise<ElevationResult> {
  return new Promise((resolve, reject) => {
    elevator.getElevationForLocations(
      { locations: [{ lat: coords.lat, lng: coords.lng }] },
      (results, status) => {
        if (status === "OK" && results?.[0]) {
          const result = {
            elevation: results[0].elevation,
            location: { lat: results[0].location.lat(), lng: results[0].location.lng() },
          };
          emit("elevation_fetch", { elevation: result.elevation });
          resolve(result);
        } else {
          reject(new Error(`Elevation failed: ${status}`));
        }
      }
    );
  });
}
