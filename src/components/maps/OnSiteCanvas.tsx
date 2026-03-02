"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ThreeJSOverlayView } from "@googlemaps/three";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";
import { loadPerfProfile, fpsCap, shouldLazyRender, type PerfProfile } from "@/lib/onsite/perf";
import { emit } from "@/lib/telemetry";

interface OnSiteCanvasProps {
  map: google.maps.Map;
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
  const overlayRef = useRef<ThreeJSOverlayView | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const [loading, setLoading] = useState(true);
  const lastRenderRef = useRef(Date.now());
  const isInteractingRef = useRef(false);
  const frameTimerRef = useRef<number | null>(null);
  const profile = perfProfile || loadPerfProfile();

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

  const scheduleRender = useCallback(() => {
    if (!overlayRef.current) return;

    if (profile.fpsCap) {
      if (frameTimerRef.current) return;

      frameTimerRef.current = window.setTimeout(() => {
        overlayRef.current?.requestRedraw();
        frameTimerRef.current = null;
        lastRenderRef.current = Date.now();
      }, fpsCap(profile.fpsCap));
    } else {
      overlayRef.current.requestRedraw();
      lastRenderRef.current = Date.now();
    }
  }, [profile.fpsCap]);

  useEffect(() => {
    if (!map) return;

    const overlay = new ThreeJSOverlayView({
      map,
      anchor: { lat: placement.lat, lng: placement.lng, altitude: placement.altitude },
      upAxis: "Y",
    });

    overlayRef.current = overlay;

    const handleInteractionStart = () => {
      isInteractingRef.current = true;
      emit("map_camera_sync", { action: "start" });
    };

    const handleInteractionEnd = () => {
      isInteractingRef.current = false;
      emit("map_camera_sync", { action: "end" });
    };

    map.addListener("drag", handleInteractionStart);
    map.addListener("idle", handleInteractionEnd);
    map.addListener("zoom_changed", handleInteractionStart);

    overlay.onAdd = () => {
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

      loadModel();
    };

    overlay.onDraw = () => {
      if (profile.lazyRender && shouldLazyRender(
        lastRenderRef.current,
        1000,
        isInteractingRef.current
      )) {
        return;
      }
      lastRenderRef.current = Date.now();
    };

    return () => {
      overlay.setMap(null);
      google.maps.event.clearInstanceListeners(map);
      if (frameTimerRef.current) {
        clearTimeout(frameTimerRef.current);
      }
      if (sceneRef.current && modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }
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
    if (overlayRef.current) {
      overlayRef.current.anchor = {
        lat: placement.lat,
        lng: placement.lng,
        altitude: placement.altitude,
      };
      scheduleRender();
    }
  }, [placement.lat, placement.lng, placement.altitude, scheduleRender]);

  return null;
}
