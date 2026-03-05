export const MAP_CONFIG = {
  zoom: 17,
  pitch: 0,
  bearing: 0,
  style: "https://demotiles.maplibre.org/style.json",
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
