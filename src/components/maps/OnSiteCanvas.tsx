"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { type CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";
import { loadPerfProfile, fpsCap, shouldLazyRender, type PerfProfile } from "@/lib/onsite/perf";
import { emit } from "@/lib/telemetry";

const LAYER_ID = "three-model-layer";

interface OnSiteCanvasProps {
  map: maplibregl.Map;
  modelUrl: string;
  placement: PlacementTransform;
  ghostAnchor?: Coords | null;
  perfProfile?: PerfProfile;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}

export function OnSiteCanvas({
  map,
  modelUrl,
  placement,
  ghostAnchor,
  perfProfile,
  onProgress,
  onError,
  onLoaded,
}: OnSiteCanvasProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera>(new THREE.Camera());
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRenderRef = useRef(Date.now());
  const isInteractingRef = useRef(false);
  const frameTimerRef = useRef<number | null>(null);
  const placementRef = useRef(placement);
  const profile = perfProfile || loadPerfProfile();

  // Keep placement ref in sync so the render callback sees latest values
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

  const scheduleRender = useCallback(() => {
    if (profile.fpsCap) {
      if (frameTimerRef.current) return;

      frameTimerRef.current = window.setTimeout(() => {
        map.triggerRepaint();
        frameTimerRef.current = null;
        lastRenderRef.current = Date.now();
      }, fpsCap(profile.fpsCap));
    } else {
      map.triggerRepaint();
      lastRenderRef.current = Date.now();
    }
  }, [profile.fpsCap, map]);

  useEffect(() => {
    if (!map) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const ambientIntensity = profile.lowEnd ? 0.5 : 0.6;
    const directionalIntensity = profile.lowEnd ? 0.6 : 0.8;

    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = !profile.lowEnd;
    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = profile.lowEnd ? 512 : 1024;
      directionalLight.shadow.mapSize.height = profile.lowEnd ? 512 : 1024;
    }
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

      render(gl, matrix) {
        if (profile.lazyRender && shouldLazyRender(
          lastRenderRef.current,
          1000,
          isInteractingRef.current
        )) {
          return;
        }
        lastRenderRef.current = Date.now();

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

    // Remove existing layer if present (hot reload / strict mode)
    if (map.getLayer(LAYER_ID)) {
      map.removeLayer(LAYER_ID);
    }
    map.addLayer(customLayer);

    const handleInteractionStart = () => {
      isInteractingRef.current = true;
      emit("map_camera_sync", { action: "start" });
    };

    const handleInteractionEnd = () => {
      isInteractingRef.current = false;
      emit("map_camera_sync", { action: "end" });
    };

    map.on("drag", handleInteractionStart);
    map.on("idle", handleInteractionEnd);
    map.on("zoom", handleInteractionStart);

    return () => {
      map.off("drag", handleInteractionStart);
      map.off("idle", handleInteractionEnd);
      map.off("zoom", handleInteractionStart);
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (frameTimerRef.current) {
        clearTimeout(frameTimerRef.current);
      }
      if (sceneRef.current && modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
      rendererRef.current = null;
    };
  }, [map, loadModel, profile.lowEnd, profile.lazyRender, scheduleRender]);

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.setScalar(placement.scale);
      modelRef.current.rotation.y = THREE.MathUtils.degToRad(placement.heading);
      emit("model_interaction", { scale: placement.scale, heading: placement.heading });
      scheduleRender();
    }
  }, [placement.scale, placement.heading, scheduleRender]);

  useEffect(() => {
    // Anchor change — just trigger repaint, render() reads placementRef
    scheduleRender();
  }, [placement.lat, placement.lng, placement.altitude, scheduleRender]);

  return null;
}
