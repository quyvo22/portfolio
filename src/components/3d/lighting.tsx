"use client";

import { Environment, ContactShadows } from "@react-three/drei";
import { LIGHTING } from "@/lib/3d-config";

interface LightingProps {
  isMobile: boolean;
}

export function Lighting({ isMobile }: LightingProps) {
  return (
    <>
      <ambientLight intensity={LIGHTING.ambientIntensity} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={LIGHTING.directionalIntensity}
      />
      <Environment
        preset={LIGHTING.envPreset}
        resolution={isMobile ? 128 : 256}
      />
      {!isMobile && (
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={LIGHTING.shadowOpacity}
          blur={LIGHTING.shadowBlur}
          far={10}
        />
      )}
    </>
  );
}
