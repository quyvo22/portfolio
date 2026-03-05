"use client";

import { useEffect, useRef } from "react";
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
  const lastRenderRef = useRef(Date.now());
  const isInteractingRef = useRef(false);
  const frameTimerRef = useRef<number | null>(null);
  const placementRef = useRef(placement);
  const profileRef = useRef(perfProfile || loadPerfProfile());
  const modelUrlRef = useRef(modelUrl);
  const callbacksRef = useRef({ onProgress, onError, onLoaded });
  const needsRenderRef = useRef(true);

  // Keep refs in sync
  useEffect(() => { placementRef.current = placement; }, [placement]);
  useEffect(() => { profileRef.current = perfProfile || loadPerfProfile(); }, [perfProfile]);
  useEffect(() => { modelUrlRef.current = modelUrl; }, [modelUrl]);
  useEffect(() => { callbacksRef.current = { onProgress, onError, onLoaded }; }, [onProgress, onError, onLoaded]);

  const triggerRepaint = () => {
    needsRenderRef.current = true;
    const profile = profileRef.current;
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
  };

  // === MAIN EFFECT: create scene + layer ONCE ===
  useEffect(() => {
    if (!map) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const profile = profileRef.current;

    const ambientLight = new THREE.AmbientLight(0xffffff, profile.lowEnd ? 0.5 : 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, profile.lowEnd ? 0.6 : 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = !profile.lowEnd;
    if (directionalLight.castShadow) {
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
    }
    scene.add(directionalLight);

    const loadModel = async () => {
      const url = modelUrlRef.current;
      if (!url || !sceneRef.current) return;

      const loader = new GLTFLoader();
      try {
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            (xhr) => {
              const pct = xhr.total ? (xhr.loaded / xhr.total) * 100 : 0;
              callbacksRef.current.onProgress?.(pct);
            },
            reject
          );
        });

        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
        }

        const model = gltf.scene;
        const p = placementRef.current;
        model.scale.setScalar(p.scale);
        model.rotation.y = THREE.MathUtils.degToRad(p.heading);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        modelRef.current = model;
        sceneRef.current.add(model);
        needsRenderRef.current = true;
        callbacksRef.current.onLoaded?.();
        map.triggerRepaint();
      } catch (err) {
        console.error("Model load error:", err);
        callbacksRef.current.onError?.(
          err instanceof Error ? err.message : "Failed to load model"
        );
      }
    };

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

      render(_gl, args) {
        const prof = profileRef.current;
        if (prof.lazyRender && !needsRenderRef.current && shouldLazyRender(
          lastRenderRef.current,
          1000,
          isInteractingRef.current
        )) {
          return;
        }
        needsRenderRef.current = false;
        lastRenderRef.current = Date.now();

        const p = placementRef.current;
        const anchor = maplibregl.MercatorCoordinate.fromLngLat(
          [p.lng, p.lat],
          p.altitude
        );

        const s = anchor.meterInMercatorCoordinateUnits();
        const m = new THREE.Matrix4()
          .makeTranslation(anchor.x, anchor.y, anchor.z ?? 0)
          .scale(new THREE.Vector3(s, -s, s));

        cameraRef.current.projectionMatrix = new THREE.Matrix4()
          .fromArray(args.modelViewProjectionMatrix as unknown as number[])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // === Scale / heading updates ===
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.scale.setScalar(placement.scale);
      modelRef.current.rotation.y = THREE.MathUtils.degToRad(placement.heading);
      emit("model_interaction", { scale: placement.scale, heading: placement.heading });
      triggerRepaint();
    }
  }, [placement.scale, placement.heading]);

  // === Position updates (just repaint, render() reads ref) ===
  useEffect(() => {
    triggerRepaint();
  }, [placement.lat, placement.lng, placement.altitude]);

  return null;
}
