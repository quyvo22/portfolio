import { DEFAULT_PLACEMENT } from "./config";
import type { OnsitePlacementState, PlacementTransform, LotPolygon, Coords } from "./types";

const STORAGE_KEY = "onsite_placement";

export function loadPlacementState(projectSlug: string): OnsitePlacementState {
  if (typeof window === "undefined") {
    return {
      placement: null,
      polygon: null,
      ghostAnchor: null,
      mode: "place",
    };
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${projectSlug}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load placement state:", e);
  }

  return {
    placement: null,
    polygon: null,
    ghostAnchor: null,
    mode: "place",
  };
}

export function savePlacementState(projectSlug: string, state: OnsitePlacementState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY}_${projectSlug}`, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save placement state:", e);
  }
}

export function updatePlacement(
  current: PlacementTransform | null,
  updates: Partial<PlacementTransform>
): PlacementTransform {
  return { ...(current || DEFAULT_PLACEMENT), ...updates };
}

export function computeCentroid(path: Coords[]): Coords | null {
  if (path.length < 3) return null;

  let lat = 0;
  let lng = 0;

  for (const p of path) {
    lat += p.lat;
    lng += p.lng;
  }

  return {
    lat: lat / path.length,
    lng: lng / path.length,
  };
}

export function setPolygon(polygon: LotPolygon | null): LotPolygon | null {
  if (!polygon) return null;
  return {
    ...polygon,
    centroid: computeCentroid(polygon.path) ?? undefined,
  };
}
