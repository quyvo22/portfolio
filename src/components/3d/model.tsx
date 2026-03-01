"use client";

import { useEffect, useRef } from "react";
import { useGLTF, Bounds } from "@react-three/drei";
import { DRACO_PATH } from "@/lib/3d-config";
import type { Group } from "three";

interface ModelProps {
  url: string;
}

export function Model({ url }: ModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(url, DRACO_PATH);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      scene.traverse((child: any) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m: any) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [scene]);

  return (
    <Bounds fit clip observe damping={6} margin={1.2}>
      <group ref={groupRef}>
        <primitive object={scene} />
      </group>
    </Bounds>
  );
}
