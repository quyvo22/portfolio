import maplibregl, { type CustomLayerInterface } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fpsCap, shouldLazyRender, type PerfProfile } from "@/lib/onsite/perf";
import { fpsThrottle } from "@/lib/utils/rafThrottle";
import { emit } from "@/lib/telemetry";
import type { PlacementTransform } from "@/lib/onsite/types";

export interface OverlayConfig {
  layerId: string;
  modelUrl: string;
  initialTransform: PlacementTransform;
  perfProfile: PerfProfile;
  scene: THREE.Scene;
  onModelLoaded?: () => void;
  onProgress?: (pct: number) => void;
  onError?: (msg: string) => void;
}

export interface GLBOverlayHandle {
  layer: CustomLayerInterface;
  setTransform: (t: PlacementTransform) => void;
  setPerfProfile: (p: PerfProfile) => void;
  triggerRepaint: () => void;
  dispose: () => void;
}

export function createGLBOverlay(
  map: maplibregl.Map,
  config: OverlayConfig
): GLBOverlayHandle {
  let renderer: THREE.WebGLRenderer | null = null;
  const camera = new THREE.Camera();
  let model: THREE.Object3D | null = null;
  let currentTransform = { ...config.initialTransform };
  let currentPerf = { ...config.perfProfile };
  let lastRender = Date.now();
  let isInteracting = false;
  let disposed = false;

  let throttledRepaint = fpsThrottle(
    () => {
      if (!disposed) map.triggerRepaint();
    },
    currentPerf.fpsCap ? fpsCap(currentPerf.fpsCap) : null
  );

  async function loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf: any = await new Promise((resolve, reject) => {
        loader.load(
          config.modelUrl,
          resolve,
          (xhr) => {
            config.onProgress?.(
              xhr.total ? (xhr.loaded / xhr.total) * 100 : 0
            );
          },
          reject
        );
      });

      if (model) config.scene.remove(model);
      const loadedModel: THREE.Object3D = gltf.scene;
      loadedModel.scale.setScalar(currentTransform.scale);
      loadedModel.rotation.y = THREE.MathUtils.degToRad(currentTransform.heading);

      const box = new THREE.Box3().setFromObject(loadedModel);
      const center = box.getCenter(new THREE.Vector3());
      loadedModel.position.set(-center.x, -box.min.y, -center.z);

      model = loadedModel;
      config.scene.add(loadedModel);
      config.onModelLoaded?.();
      map.triggerRepaint();
    } catch (e: unknown) {
      config.onError?.(
        e instanceof Error ? e.message : "Failed to load model"
      );
    }
  }

  const layer: CustomLayerInterface = {
    id: config.layerId,
    type: "custom",
    renderingMode: "3d",

    onAdd(_map, gl) {
      renderer = new THREE.WebGLRenderer({
        canvas: _map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      loadModel();
    },

    render(_gl, matrix) {
      if (
        currentPerf.lazyRender &&
        shouldLazyRender(lastRender, 1000, isInteracting)
      ) {
        return;
      }
      lastRender = Date.now();

      const anchor = maplibregl.MercatorCoordinate.fromLngLat(
        [currentTransform.lng, currentTransform.lat],
        currentTransform.altitude
      );
      const s = anchor.meterInMercatorCoordinateUnits();
      const m = new THREE.Matrix4()
        .makeTranslation(anchor.x, anchor.y, anchor.z ?? 0)
        .scale(new THREE.Vector3(s, -s, s));

      camera.projectionMatrix = new THREE.Matrix4()
        .fromArray(matrix as unknown as number[])
        .multiply(m);

      if (renderer && config.scene) {
        renderer.resetState();
        renderer.render(config.scene, camera);
      }
    },
  };

  const onDrag = () => {
    isInteracting = true;
  };
  const onIdle = () => {
    isInteracting = false;
  };
  map.on("drag", onDrag);
  map.on("idle", onIdle);
  map.on("zoom", onDrag);

  return {
    layer,

    setTransform(t: PlacementTransform) {
      const scaleChanged = t.scale !== currentTransform.scale;
      const headingChanged = t.heading !== currentTransform.heading;
      currentTransform = { ...t };

      if (model && (scaleChanged || headingChanged)) {
        model.scale.setScalar(t.scale);
        model.rotation.y = THREE.MathUtils.degToRad(t.heading);
        emit("model_interaction", { scale: t.scale, heading: t.heading });
      }
      throttledRepaint.call();
    },

    setPerfProfile(p: PerfProfile) {
      currentPerf = { ...p };
      throttledRepaint.cancel();
      throttledRepaint = fpsThrottle(
        () => {
          if (!disposed) map.triggerRepaint();
        },
        p.fpsCap ? fpsCap(p.fpsCap) : null
      );
    },

    triggerRepaint() {
      throttledRepaint.call();
    },

    dispose() {
      disposed = true;
      throttledRepaint.cancel();
      map.off("drag", onDrag);
      map.off("idle", onIdle);
      map.off("zoom", onDrag);
      if (map.getLayer(config.layerId)) {
        map.removeLayer(config.layerId);
      }
      if (model) config.scene.remove(model);
      renderer = null;
    },
  };
}
