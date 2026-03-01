/**
 * Section/clipping planes for X, Y, Z axes (ADVANCED).
 *
 * Migration notes:
 *   - Only rendered when FLAGS.SECTION_PLANES = true.
 *   - Completely additive; no existing file touched.
 *   - Revert: set FLAGS.SECTION_PLANES = false or remove this file.
 */

"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface SectionPlanesProps {
  axes: { x: boolean; y: boolean; z: boolean };
  offset?: { x: number; y: number; z: number };
}

export function SectionPlanes({
  axes,
  offset = { x: 0, y: 0, z: 0 },
}: SectionPlanesProps) {
  const { gl, scene, invalidate } = useThree();

  const planes = useMemo(() => {
    return [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), offset.x),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), offset.y),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), offset.z),
    ];
  }, [offset.x, offset.y, offset.z]);

  useEffect(() => {
    const active: THREE.Plane[] = [];
    if (axes.x) active.push(planes[0]);
    if (axes.y) active.push(planes[1]);
    if (axes.z) active.push(planes[2]);

    gl.clippingPlanes = active;
    gl.localClippingEnabled = active.length > 0;

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];
        mats.forEach((mat) => {
          mat.clippingPlanes = active.length > 0 ? active : null;
          mat.clipShadows = true;
          mat.needsUpdate = true;
        });
      }
    });

    invalidate();

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [axes.x, axes.y, axes.z, planes, gl, scene, invalidate]);

  return null;
}
