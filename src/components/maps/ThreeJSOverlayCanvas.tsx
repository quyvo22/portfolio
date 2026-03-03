"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { type CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";

const LAYER_ID = "three-overlay-layer";

interface ThreeJSOverlayCanvasProps {
  map: maplibregl.Map;
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
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera>(new THREE.Camera());
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);
  const placementRef = useRef(placement);

  useEffect(() => {
    placementRef.current = placement;
  }, [placement]);

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
      map.triggerRepaint();
    } catch (error) {
      console.error("Model load error:", error);
      onError?.(error instanceof Error ? error.message : "Failed to load model");
      setLoading(false);
    }
  }, [modelUrl, placement.scale, placement.heading, onProgress, onError, onLoaded, map]);

  useEffect(() => {
    if (!map) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const customLayer: CustomLayerInterface = {
      id: LAYER_ID,
      type: "custom",
      renderingMode: "3d",

      onAdd(_map, gl) {
        const renderer = new THREE.WebGLRenderer({
          canvas: _map.getCanvas(),
          context: gl,
          antialias: true,
        });
        renderer.autoClear = false;
        rendererRef.current = renderer;

        loadModel();
      },

      render(_gl, matrix) {
        const p = placementRef.current;
        const anchor = maplibregl.MercatorCoordinate.fromLngLat(
          [p.lng, p.lat],
          p.altitude
        );

        const scale = anchor.meterInMercatorCoordinateUnits();

        const m = new THREE.Matrix4()
          .makeTranslation(anchor.x, anchor.y, anchor.z ?? 0)
          .scale(new THREE.Vector3(scale, -scale, scale));

        cameraRef.current.projectionMatrix = new THREE.Matrix4()
          .fromArray(matrix as unknown as number[])
          .multiply(m);

        if (rendererRef.current && sceneRef.current) {
          rendererRef.current.resetState();
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      },
    };

    if (map.getLayer(LAYER_ID)) {
      map.removeLayer(LAYER_ID);
    }
    map.addLayer(customLayer);

    return () => {
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (sceneRef.current && modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
      rendererRef.current = null;
    };
  }, [map, loadModel]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.setScalar(placement.scale);
      modelRef.current.rotation.y = THREE.MathUtils.degToRad(placement.heading);
      map.triggerRepaint();
    }
  }, [placement.scale, placement.heading, map]);

  useEffect(() => {
    map.triggerRepaint();
  }, [placement.lat, placement.lng, placement.altitude, map]);

  return null;
}
