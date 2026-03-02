"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ThreeJSOverlayView } from "@googlemaps/three";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";

interface ThreeJSOverlayCanvasProps {
  map: google.maps.Map;
  modelUrl: string;
  placement: PlacementTransform;
  ghostAnchor?: Coords | null;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}

export function ThreeJSOverlayCanvas({
  map,
  modelUrl,
  placement,
  ghostAnchor,
  onProgress,
  onError,
  onLoaded,
}: ThreeJSOverlayCanvasProps) {
  const overlayRef = useRef<ThreeJSOverlayView | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);

  const loadModel = useCallback(async () => {
    if (!modelUrl || !sceneRef.current) return;

    setLoading(true);
    const loader = new GLTFLoader();

    try {
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          modelUrl,
          resolve,
          (xhr) => {
            const progress = xhr.total ? (xhr.loaded / xhr.total) * 100 : 0;
            onProgress?.(progress);
          },
          reject
        );
      });

      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      const model = gltf.scene;
      model.scale.setScalar(placement.scale);
      model.rotation.y = THREE.MathUtils.degToRad(placement.heading);

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);

      modelRef.current = model;
      sceneRef.current.add(model);

      setLoading(false);
      onLoaded?.();
      overlayRef.current?.requestRedraw();
    } catch (error) {
      console.error("Model load error:", error);
      onError?.(error instanceof Error ? error.message : "Failed to load model");
      setLoading(false);
    }
  }, [modelUrl, placement.scale, placement.heading, onProgress, onError, onLoaded]);

  useEffect(() => {
    if (!map) return;

    const overlay = new ThreeJSOverlayView({
      map,
      anchor: { lat: placement.lat, lng: placement.lng, altitude: placement.altitude },
      upAxis: "Y",
    });

    overlayRef.current = overlay;

    overlay.onAdd = () => {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 7.5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      loadModel();
    };

    return () => {
      overlay.setMap(null);
      if (sceneRef.current && modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
    };
  }, [map, loadModel]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.setScalar(placement.scale);
      modelRef.current.rotation.y = THREE.MathUtils.degToRad(placement.heading);
      overlayRef.current?.requestRedraw();
    }
  }, [placement.scale, placement.heading]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.anchor = {
        lat: placement.lat,
        lng: placement.lng,
        altitude: placement.altitude,
      };
      overlayRef.current.requestRedraw();
    }
  }, [placement.lat, placement.lng, placement.altitude]);

  return null;
}
