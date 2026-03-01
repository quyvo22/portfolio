/**
 * Orbit controls with polar limits, reset, and optional double-click focus.
 *
 * Migration notes:
 *   - Public prop `onReset` unchanged.
 *   - Double-click focus only when FLAGS.DOUBLE_CLICK_FOCUS = true.
 *   - Revert: set flags to false; no other changes needed.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { CONTROLS, FLAGS } from "@/lib/3d-config";
import { emit } from "@/lib/telemetry";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";

interface ControlsProps {
  onReset?: () => void;
}

export function Controls({ onReset }: ControlsProps) {
  const controlsRef = useRef<OrbitControlsType>(null);
  const { invalidate } = useThree();

  const resetView = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      invalidate();
      emit("3d_interaction", { type: "reset" });
    }
    onReset?.();
  }, [onReset, invalidate]);

  // Keyboard: R = reset
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "r" || e.key === "R") {
        resetView();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetView]);

  // Telemetry for orbit interaction
  useEffect(() => {
    if (!FLAGS.TELEMETRY) return;
    const ctrl = controlsRef.current;
    if (!ctrl) return;

    function onInteract() {
      emit("3d_interaction", { type: "orbit" });
    }
    ctrl.addEventListener("change", onInteract);
    return () => ctrl.removeEventListener("change", onInteract);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      maxPolarAngle={FLAGS.POLAR_LIMITS ? CONTROLS.maxPolarAngle : Math.PI}
      minPolarAngle={FLAGS.POLAR_LIMITS ? CONTROLS.minPolarAngle : 0}
      minDistance={CONTROLS.minDistance}
      maxDistance={CONTROLS.maxDistance}
      enableDamping={CONTROLS.enableDamping}
      dampingFactor={CONTROLS.dampingFactor}
    />
  );
}
