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
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Tiles &copy; Esri",
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "esri-satellite",
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
