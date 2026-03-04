"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import maplibregl from "maplibre-gl";
import "@maptiler/sdk/dist/maptiler-sdk.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MAPTILER_DEFAULTS } from "@/lib/maptiler/config";
import {
  type GlbMapState,
  DEFAULT_GLB_STATE,
  persistToUrl,
  restoreFromUrl,
} from "@/lib/maptiler/geo";
import { GlbControls } from "./GlbControls";
import "@/styles/maptiler-glb.css";

const LAYER_ID = "glb-three-layer";

export function GlbOnMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera>(new THREE.Camera());
  const modelRef = useRef<THREE.Object3D | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const stateRef = useRef<GlbMapState>(DEFAULT_GLB_STATE);

  const [state, setState] = useState<GlbMapState>(DEFAULT_GLB_STATE);
  const [picking, setPicking] = useState(false);

  // Restore from URL on mount
  useEffect(() => {
    const restored = restoreFromUrl();
    setState(restored);
    stateRef.current = restored;
  }, []);

  // Keep ref in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist to URL on state change (debounced)
  useEffect(() => {
    const t = setTimeout(() => persistToUrl(state), 300);
    return () => clearTimeout(t);
  }, [state]);

  const loadGlb = useCallback((url: string) => {
    if (!url || !sceneRef.current) return;

    if (modelRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current = null;
    }

    const loader = new GLTFLoader();

    try {
      const draco = new DRACOLoader();
      draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
      loader.setDRACOLoader(draco);
    } catch {
      // DRACO optional
    }

    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);

        const s = stateRef.current;
        model.scale.setScalar(s.scale);
        model.rotation.y = THREE.MathUtils.degToRad(s.heading);

        modelRef.current = model;
        sceneRef.current!.add(model);
        mapRef.current?.triggerRepaint();
      },
      undefined,
      (err) => {
        console.error("GLB load error:", err);
      }
    );
  }, []);

  // Init map
  useEffect(() => {
    if (!containerRef.current) return;

    maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";

    const s = stateRef.current;
    const map = new maptilersdk.Map({
      container: containerRef.current,
      style: MAPTILER_DEFAULTS.style,
      center: [s.lng || MAPTILER_DEFAULTS.center[0], s.lat || MAPTILER_DEFAULTS.center[1]],
      zoom: MAPTILER_DEFAULTS.zoom,
      pitch: MAPTILER_DEFAULTS.pitch,
      bearing: MAPTILER_DEFAULTS.bearing,
    } as maptilersdk.MapOptions & { antialias?: boolean });

    mapRef.current = map;

    map.on("load", () => {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
      hemi.position.set(0, 50, 0);
      scene.add(hemi);

      const dir = new THREE.DirectionalLight(0xffffff, 0.8);
      dir.position.set(5, 20, 10);
      dir.castShadow = true;
      scene.add(dir);

      // Ground plane (subtle, toggleable via presence)
      const groundGeo = new THREE.PlaneGeometry(200, 200);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      groundRef.current = ground;
      scene.add(ground);

      const customLayer: maptilersdk.CustomLayerInterface = {
        id: LAYER_ID,
        type: "custom" as const,
        renderingMode: "3d",

        onAdd(_map: maptilersdk.Map, gl: WebGLRenderingContext) {
          const renderer = new THREE.WebGLRenderer({
            canvas: _map.getCanvas(),
            context: gl,
            antialias: true,
          });
          renderer.autoClear = false;
          renderer.setPixelRatio(window.devicePixelRatio);
          rendererRef.current = renderer;

          if (stateRef.current.url) {
            loadGlb(stateRef.current.url);
          }
        },

        render(_gl: WebGLRenderingContext, options: maplibregl.CustomRenderMethodInput) {
          const p = stateRef.current;
          const anchor = maptilersdk.MercatorCoordinate.fromLngLat(
            [p.lng, p.lat],
            p.altitude
          );
          const meterScale = anchor.meterInMercatorCoordinateUnits();

          const m = new THREE.Matrix4()
            .makeTranslation(anchor.x, anchor.y, anchor.z ?? 0)
            .scale(new THREE.Vector3(meterScale, -meterScale, meterScale));

          cameraRef.current.projectionMatrix = new THREE.Matrix4()
            .fromArray(options.modelViewProjectionMatrix as number[])
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
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loadGlb]);

  // Sync model transform on state changes
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.scale.setScalar(state.scale);
    modelRef.current.rotation.y = THREE.MathUtils.degToRad(state.heading);
    mapRef.current?.triggerRepaint();
  }, [state.scale, state.heading]);

  useEffect(() => {
    mapRef.current?.triggerRepaint();
  }, [state.lat, state.lng, state.altitude]);

  // Reload model when URL changes
  useEffect(() => {
    if (state.url) {
      loadGlb(state.url);
    }
  }, [state.url, loadGlb]);

  // Map click for picking
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: maptilersdk.MapMouseEvent) => {
      if (!picking) return;
      setState((prev) => ({
        ...prev,
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
      }));
      setPicking(false);
    };

    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [picking]);

  const handleChange = useCallback((patch: Partial<GlbMapState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: MAPTILER_DEFAULTS.center,
      zoom: MAPTILER_DEFAULTS.zoom,
      pitch: MAPTILER_DEFAULTS.pitch,
      bearing: MAPTILER_DEFAULTS.bearing,
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  return (
    <div className="glb-map-page">
      <div className="glb-map-container" ref={containerRef} />
      <GlbControls
        state={state}
        onChange={handleChange}
        pickingActive={picking}
        onTogglePick={() => setPicking((v) => !v)}
        onResetView={handleResetView}
        onFullscreen={handleFullscreen}
      />
    </div>
  );
}
