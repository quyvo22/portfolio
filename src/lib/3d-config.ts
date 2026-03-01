export const CAMERA = {
  fov: 45,
  position: [0, 2, 5] as [number, number, number],
  near: 0.1,
  far: 1000,
};

export const CONTROLS = {
  maxPolarAngle: Math.PI / 1.8,
  minDistance: 0.5,
  maxDistance: 50,
  enableDamping: true,
  dampingFactor: 0.1,
};

export const LIGHTING = {
  envPreset: "apartment" as const,
  shadowOpacity: 0.4,
  shadowBlur: 2,
  ambientIntensity: 0.5,
  directionalIntensity: 1,
};

export const MOBILE_BREAKPOINT = 768;

export const DRACO_PATH =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

export const LOAD_TIMEOUT = 30_000;

export const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100 MB
