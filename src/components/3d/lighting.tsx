/**
 * Lighting with presets and optional env intensity control.
 *
 * Migration notes:
 *   - Previous prop `isMobile` replaced by `disableShadows` (same intent).
 *   - New optional props: `preset`, `envIntensity` — safe defaults.
 *   - Revert: remove optional props; uses DEFAULT_LIGHT_PRESET.
 */

"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import {
  FLAGS,
  SHADOW,
  LIGHT_PRESETS,
  DEFAULT_LIGHT_PRESET,
  type LightPresetKey,
} from "@/lib/3d-config";

interface LightingProps {
  isMobile?: boolean;
  disableShadows?: boolean;
  preset?: LightPresetKey;
  envIntensity?: number;
  envResolution?: number;
}

export function Lighting({
  isMobile = false,
  disableShadows = false,
  preset = DEFAULT_LIGHT_PRESET,
  envIntensity,
  envResolution,
}: LightingProps) {
  const p = LIGHT_PRESETS[preset];
  const intensity = envIntensity ?? p.envIntensity;
  const resolution = envResolution ?? (isMobile ? 128 : 256);
  const showShadow = FLAGS.GROUND_SHADOW && !disableShadows && !isMobile;

  return (
    <>
      <ambientLight intensity={p.ambientIntensity} />
      <directionalLight position={[5, 8, 5]} intensity={p.directionalIntensity} />
      <Environment
        preset={p.envPreset}
        environmentIntensity={intensity}
        resolution={resolution}
      />
      {showShadow && (
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={SHADOW.opacity}
          blur={SHADOW.blur}
          far={10}
        />
      )}
    </>
  );
}
