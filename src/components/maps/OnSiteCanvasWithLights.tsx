"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";
import { loadPerfProfile, fpsCap, shouldLazyRender, type PerfProfile } from "@/lib/onsite/perf";
import { createLights, updateDirectionalLight } from "@/components/maps/Lights";
import { createGroundShadow } from "@/components/maps/GroundShadow";
import type { SunState } from "@/components/maps/SunControls";
import { emit } from "@/lib/telemetry";

const LAYER_ID = "three-model-lights-layer";

interface OnSiteCanvasWithLightsProps {
  map: maplibregl.Map;
  modelUrl: string;
  placement: PlacementTransform;
  ghostAnchor?: Coords | null;
  perfProfile?: PerfProfile;
  sunState?: SunState;
  enableSun?: boolean;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}

export function OnSiteCanvasWithLights({
  map,
  modelUrl,
  placement,
  ghostAnchor,
  perfProfile,
  sunState,
  enableSun = false,
  onProgress,
  onError,
  onLoaded,
}: OnSiteCanvasWithLightsProps) {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera>(new THREE.Camera());
  const modelRef = useRef<THREE.Object3D | null>(null);
  const lightsRef = useRef<THREE.Light[]>([]);
  const groundShadowRef = useRef<THREE.Mesh | null>(null);
  const lastRenderRef = useRef(Date.now());
  const isInteractingRef = useRef(false);
  const frameTimerRef = useRef<number | null>(null);
  const placementRef = useRef(placement);
  const profileRef = useRef(perfProfile || loadPerfProfile());
  const sunStateRef = useRef(sunState);
  const enableSunRef = useRef(enableSun);
  const modelUrlRef = useRef(modelUrl);
  const callbacksRef = useRef({ onProgress, onError, onLoaded });
  const modelLoadedRef = useRef(false);
  const needsRenderRef = useRef(true); // always render at least once on init

  // Keep refs in sync with latest props (no re-renders, no effect re-runs)
  useEffect(() => { placementRef.current = placement; }, [placement]);
  useEffect(() => { profileRef.current = perfProfile || loadPerfProfile(); }, [perfProfile]);
  useEffect(() => { sunStateRef.current = sunState; }, [sunState]);
  useEffect(() => { enableSunRef.current = enableSun; }, [enableSun]);
  useEffect(() => { modelUrlRef.current = modelUrl; }, [modelUrl]);
  useEffect(() => { callbacksRef.current = { onProgress, onError, onLoaded }; }, [onProgress, onError, onLoaded]);

  // Helper: trigger repaint respecting FPS cap
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

  // === MAIN EFFECT: create scene + layer ONCE, load model ONCE ===
  useEffect(() => {
    if (!map) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Setup lights
    const profile = profileRef.current;
    const p = placementRef.current;
    const sun = sunStateRef.current;

    if (enableSun && sun) {
      const lights = createLights({
        lat: p.lat,
        lng: p.lng,
        date: sun.date,
        hour: sun.hour,
        lowEnd: profile.lowEnd,
      });
      lights.forEach((light) => scene.add(light));
      lightsRef.current = lights;

      const groundShadow = createGroundShadow({ lowEnd: profile.lowEnd });
      scene.add(groundShadow);
      groundShadowRef.current = groundShadow;
    } else {
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
      lightsRef.current = [ambientLight, directionalLight];
    }

    // Load model
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
        const currentPlacement = placementRef.current;
        const currentProfile = profileRef.current;
        model.scale.setScalar(currentPlacement.scale);
        model.rotation.y = THREE.MathUtils.degToRad(currentPlacement.heading);

        model.traverse((child: THREE.Object3D) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = !currentProfile.lowEnd;
            child.receiveShadow = !currentProfile.lowEnd;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        modelRef.current = model;
        sceneRef.current.add(model);
        modelLoadedRef.current = true;
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

    // Custom layer
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
        renderer.shadowMap.enabled = !profileRef.current.lowEnd;
        renderer.shadowMap.type = profileRef.current.lowEnd
          ? THREE.BasicShadowMap
          : THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;

        // Handle WebGL context loss/restore gracefully
        const canvas = _map.getCanvas();
        canvas.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          console.warn("WebGL context lost — pausing Three.js rendering");
          rendererRef.current = null;
        });
        canvas.addEventListener("webglcontextrestored", () => {
          console.info("WebGL context restored");
          needsRenderRef.current = true;
          _map.triggerRepaint();
        });

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

        const curr = placementRef.current;
        // When terrain is active, query ground elevation so model sits on
        // the terrain surface instead of at sea level.
        const terrainElev = map.terrain
          ? (map.queryTerrainElevation(new maplibregl.LngLat(curr.lng, curr.lat)) ?? 0)
          : 0;
        const anchor = maplibregl.MercatorCoordinate.fromLngLat(
          [curr.lng, curr.lat],
          terrainElev + curr.altitude
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
      modelLoadedRef.current = false;
      rendererRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, enableSun]);

  // === Sun updates (no layer recreation) ===
  useEffect(() => {
    if (!enableSun || !sunState || lightsRef.current.length === 0) return;

    const directional = lightsRef.current.find(
      (l) => l instanceof THREE.DirectionalLight
    ) as THREE.DirectionalLight | undefined;

    if (directional) {
      updateDirectionalLight(directional, {
        lat: placement.lat,
        lng: placement.lng,
        date: sunState.date,
        hour: sunState.hour,
        lowEnd: (perfProfile || profileRef.current).lowEnd,
      });
      triggerRepaint();
    }
  }, [enableSun, sunState, placement.lat, placement.lng, perfProfile]);

  // === Scale / heading updates (no layer recreation) ===
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
