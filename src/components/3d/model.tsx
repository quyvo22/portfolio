/**
 * GLB model loader with bounds-fit and optional wireframe.
 *
 * Migration notes:
 *   - Props `url` unchanged. New optional props have safe defaults.
 *   - wireframe only applies when FLAGS.WIREFRAME_TOGGLE && wireframe=true.
 *   - Revert: remove optional props; behaviour identical.
 */

"use client";

import { useEffect, useRef, useMemo } from "react";
import { useGLTF, Bounds } from "@react-three/drei";
import { DRACO_PATH, FLAGS } from "@/lib/3d-config";
import { emit } from "@/lib/telemetry";
import type { Group, Mesh, Material } from "three";
import * as THREE from "three";

interface ModelProps {
  url: string;
  wireframe?: boolean;
}

export function Model({ url, wireframe = false }: ModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF(url, DRACO_PATH);
  const loadStart = useRef(Date.now());

  useEffect(() => {
    const duration = Date.now() - loadStart.current;
    emit("3d_view_loaded", { url, durationMs: duration });
  }, [url]);

  useEffect(() => {
    if (!FLAGS.WIREFRAME_TOGGLE) return;
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        materials.forEach((mat: Material) => {
          if ("wireframe" in mat) {
            (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
          }
        });
      }
    });
  }, [scene, wireframe]);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    return () => {
      cloned.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          mats.forEach((m) => m.dispose());
        }
      });
    };
  }, [cloned]);

  return (
    <Bounds fit clip observe margin={1.2}>
      <group ref={groupRef}>
        <primitive object={cloned} />
      </group>
    </Bounds>
  );
}
