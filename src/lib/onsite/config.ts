import type { PlacementTransform } from "./types";
import type { StyleSpecification } from "maplibre-gl";

export const DEFAULT_PLACEMENT: PlacementTransform = {
  lat: 10.762622,
  lng: 106.660172,
  altitude: 0,
  heading: 0,
  scale: 1,
};

export const HEADING_STEP = 15;
export const ALTITUDE_STEP = 0.5;
export const SCALE_MIN = 0.1;
export const SCALE_MAX = 5;

export const MAP_CONFIG = {
  zoom: 18,
  pitch: 0,
  bearing: 0,
  style: {
    version: 8,
    sources: {
      "carto-positron": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxzoom: 20,
      },
    },
    layers: [
      {
        id: "carto-positron",
        type: "raster",
        source: "carto-positron",
      },
    ],
  } as StyleSpecification,
};

export const STORAGE_CONFIG = {
  ALLOW_PROXY_FALLBACK: false,
  SIZE_LIMIT_MB: 100,
  MIME_WHITELIST: [
    "model/gltf-binary",
    "model/gltf+json",
    "application/octet-stream",
    "application/json",
  ],
};

export const COST_GUARD = {
  geocodeDebounceMs: 600,
  cacheTTL: "1d",
  perSessionWarn: 50,
};
