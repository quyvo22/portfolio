/**
 * 3D Viewer configuration & feature flags.
 *
 * Migration notes:
 *   - All MEDIUM/ADVANCED flags default to `false` → behaviour identical to previous version.
 *   - To revert entirely: set every flag to `false`; no other change needed.
 *   - To enable a tier: flip the relevant flags to `true`.
 */

// ── Feature Flags ────────────────────────────────────────

export const FLAGS = {
  // BASIC (always on — matches previous behaviour)
  BOUNDS_FIT: true,
  RESET_VIEW: true,
  PROGRESS_INDICATOR: true,
  POLAR_LIMITS: true,
  GROUND_SHADOW: true,
  LIGHT_PRESETS: true,
  FALLBACK_POSTER: true,

  // MEDIUM
  DOUBLE_CLICK_FOCUS: false,
  WIREFRAME_TOGGLE: true,
  ENV_HDRI_SWITCH: true,
  LAZY_MOUNT: true,
  TELEMETRY: true,

  // ADVANCED
  SECTION_PLANES: true,
  MEASURE_TOOL: true,
  LOW_END_PROFILE: true,
} as const;

// ── Camera ───────────────────────────────────────────────

export const CAMERA = {
  fov: 45,
  position: [0, 2, 5] as [number, number, number],
  near: 0.1,
  far: 1000,
};

// ── Controls ─────────────────────────────────────────────

export const CONTROLS = {
  maxPolarAngle: Math.PI / 1.8,
  minPolarAngle: 0.1,
  minDistance: 0.5,
  maxDistance: 50,
  enableDamping: true,
  dampingFactor: 0.1,
};

// ── Lighting presets ─────────────────────────────────────

export type LightPresetKey = "studio" | "city" | "sunset" | "warehouse";

export interface LightPreset {
  label: string;
  envPreset: "apartment" | "city" | "sunset" | "warehouse" | "studio";
  ambientIntensity: number;
  directionalIntensity: number;
  envIntensity: number;
}

export const LIGHT_PRESETS: Record<LightPresetKey, LightPreset> = {
  studio: {
    label: "Studio",
    envPreset: "studio",
    ambientIntensity: 0.5,
    directionalIntensity: 1,
    envIntensity: 1,
  },
  city: {
    label: "City",
    envPreset: "city",
    ambientIntensity: 0.4,
    directionalIntensity: 0.8,
    envIntensity: 0.8,
  },
  sunset: {
    label: "Sunset",
    envPreset: "sunset",
    ambientIntensity: 0.3,
    directionalIntensity: 1.2,
    envIntensity: 1.2,
  },
  warehouse: {
    label: "Warehouse",
    envPreset: "warehouse",
    ambientIntensity: 0.6,
    directionalIntensity: 0.7,
    envIntensity: 0.9,
  },
};

export const DEFAULT_LIGHT_PRESET: LightPresetKey = "studio";

// ── Shadow ───────────────────────────────────────────────

export const SHADOW = {
  opacity: 0.4,
  blur: 2,
};

// ── Misc ─────────────────────────────────────────────────

export const MOBILE_BREAKPOINT = 768;

export const DRACO_PATH =
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

export const LOAD_TIMEOUT = 30_000;

export const MAX_MODEL_SIZE = 100 * 1024 * 1024; // 100 MB

// ── Low-end thresholds ───────────────────────────────────

export const LOW_END = {
  maxDpr: 1,
  fpsCap: 30,
  envResolution: 64,
  disableShadows: true,
  disableAntialias: true,
};
