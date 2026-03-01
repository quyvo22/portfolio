"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { CONTROLS } from "@/lib/3d-config";

interface ControlsProps {
  onReset?: () => void;
}

export function Controls({ onReset }: ControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const initialCameraState = useRef({
    position: camera.position.clone(),
    target: null as any,
  });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "r" || e.key === "R") {
        if (controlsRef.current) {
          controlsRef.current.reset();
          onReset?.();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onReset]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      maxPolarAngle={CONTROLS.maxPolarAngle}
      minDistance={CONTROLS.minDistance}
      maxDistance={CONTROLS.maxDistance}
      enableDamping={CONTROLS.enableDamping}
      dampingFactor={CONTROLS.dampingFactor}
    />
  );
}
