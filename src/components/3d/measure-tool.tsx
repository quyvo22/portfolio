/**
 * Two-point measurement tool (ADVANCED).
 *
 * Migration notes:
 *   - Only rendered when FLAGS.MEASURE_TOOL = true.
 *   - Completely additive; no existing file touched.
 *   - Revert: set FLAGS.MEASURE_TOOL = false or remove this file.
 */

"use client";

import { useState, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { emit } from "@/lib/telemetry";

interface MeasureToolProps {
  active: boolean;
}

export function MeasureTool({ active }: MeasureToolProps) {
  const { scene, camera, raycaster, gl } = useThree();
  const [points, setPoints] = useState<THREE.Vector3[]>([]);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!active) return;

      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      const meshes: THREE.Object3D[] = [];
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) meshes.push(child);
      });

      const hits = raycaster.intersectObjects(meshes, false);
      if (hits.length === 0) return;

      const point = hits[0].point.clone();

      setPoints((prev) => {
        if (prev.length >= 2) {
          return [point]; // start new measurement
        }
        const next = [...prev, point];
        if (next.length === 2) {
          const dist = next[0].distanceTo(next[1]);
          emit("3d_interaction", { type: "measure", distance: dist });
        }
        return next;
      });
    },
    [active, camera, gl, raycaster, scene]
  );

  // Attach click listener
  const domElement = gl.domElement;
  useState(() => {
    if (!active) return;
    domElement.addEventListener("click", handleClick);
    return () => domElement.removeEventListener("click", handleClick);
  });

  if (!active || points.length === 0) return null;

  const distance =
    points.length === 2 ? points[0].distanceTo(points[1]) : null;

  const midPoint =
    points.length === 2
      ? new THREE.Vector3()
          .addVectors(points[0], points[1])
          .multiplyScalar(0.5)
      : null;

  return (
    <group>
      {/* Point markers */}
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      ))}

      {/* Line between points */}
      {points.length === 2 && (
        <Line
          points={[points[0], points[1]]}
          color="#f59e0b"
          lineWidth={2}
        />
      )}

      {/* Distance label */}
      {distance !== null && midPoint && (
        <Html position={midPoint} center>
          <div className="px-2 py-1 rounded bg-black/80 text-white text-xs font-mono whitespace-nowrap">
            {distance.toFixed(3)} units
          </div>
        </Html>
      )}
    </group>
  );
}
