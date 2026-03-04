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
  pitch: 45,
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
      "openmaptiles": {
        type: "vector",
        tiles: [
          "https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf",
        ],
        maxzoom: 14,
      },
      "terrain-dem": {
        type: "raster-dem",
        tiles: [
          "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
        ],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      },
    },
    terrain: {
      source: "terrain-dem",
      exaggeration: 1.5,
    },
    layers: [
      {
        id: "esri-satellite-layer",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: "3d-buildings",
        type: "fill-extrusion",
        source: "openmaptiles",
        "source-layer": "building",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0, "#e0e0e0",
            50, "#c0c0c0",
            100, "#a0a0a0",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14, 0,
            14.5, ["get", "render_height"],
          ],
          "fill-extrusion-base": [
            "case",
            ["has", "render_min_height"],
            ["get", "render_min_height"],
            0,
          ],
          "fill-extrusion-opacity": 0.7,
        },
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
