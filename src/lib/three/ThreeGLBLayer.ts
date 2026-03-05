import maplibregl, { type CustomLayerInterface, type CustomRenderMethodInput } from "maplibre-gl";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface ThreeGLBLayerOptions {
  id?: string;
  modelUrl: string;
  lng: number;
  lat: number;
  heading?: number;
  scale?: number;
  onProgress?: (pct: number) => void;
  onError?: (msg: string) => void;
  onLoaded?: () => void;
}

export class ThreeGLBLayer implements CustomLayerInterface {
  readonly id: string;
  readonly type = "custom" as const;
  readonly renderingMode = "3d" as const;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private model: THREE.Object3D | null = null;
  private map: maplibregl.Map | null = null;

  private lng: number;
  private lat: number;
  private heading: number;
  private modelScale: number;
  private modelUrl: string;

  private onProgress?: (pct: number) => void;
  private onError?: (msg: string) => void;
  private onLoaded?: () => void;

  constructor(options: ThreeGLBLayerOptions) {
    this.id = options.id ?? "glb-model";
    this.lng = options.lng;
    this.lat = options.lat;
    this.heading = options.heading ?? 0;
    this.modelScale = options.scale ?? 1;
    this.modelUrl = options.modelUrl;
    this.onProgress = options.onProgress;
    this.onError = options.onError;
    this.onLoaded = options.onLoaded;
  }

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(5, 10, 7.5);
    this.scene.add(directional);

    this.loadModel();
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput) {
    const anchor = maplibregl.MercatorCoordinate.fromLngLat(
      [this.lng, this.lat],
      0
    );
    const s = anchor.meterInMercatorCoordinateUnits();

    const localToWorld = new THREE.Matrix4()
      .makeTranslation(anchor.x, anchor.y, anchor.z ?? 0)
      .scale(new THREE.Vector3(s, -s, s));

    this.camera.projectionMatrix = new THREE.Matrix4()
      .fromArray(args.modelViewProjectionMatrix as unknown as number[])
      .multiply(localToWorld);

    if (this.renderer) {
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
    }
  }

  setTransform(lat: number, lng: number, heading: number, scale: number) {
    this.lat = lat;
    this.lng = lng;
    this.heading = heading;
    this.modelScale = scale;

    if (this.model) {
      this.model.scale.setScalar(scale);
      this.model.rotation.y = THREE.MathUtils.degToRad(heading);
    }

    this.map?.triggerRepaint();
  }

  dispose() {
    if (this.map && this.map.getLayer(this.id)) {
      this.map.removeLayer(this.id);
    }
    if (this.model) {
      this.scene.remove(this.model);
    }
    this.renderer = null;
    this.map = null;
  }

  private async loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf: any = await new Promise((resolve, reject) => {
        loader.load(
          this.modelUrl,
          resolve,
          (xhr) => {
            const pct = xhr.total ? (xhr.loaded / xhr.total) * 100 : 0;
            this.onProgress?.(pct);
          },
          reject
        );
      });

      const model = gltf.scene;
      model.scale.setScalar(this.modelScale);
      model.rotation.y = THREE.MathUtils.degToRad(this.heading);

      // Center model horizontally, place bottom at origin
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.set(-center.x, -box.min.y, -center.z);

      // Debug logging
      const size = box.getSize(new THREE.Vector3());
      const anchor = maplibregl.MercatorCoordinate.fromLngLat([this.lng, this.lat], 0);
      console.log("[ThreeGLBLayer] Model loaded:", {
        boundingBox: { x: size.x.toFixed(2), y: size.y.toFixed(2), z: size.z.toFixed(2) },
        mercatorScale: anchor.meterInMercatorCoordinateUnits(),
        anchor: { lng: this.lng, lat: this.lat },
      });

      this.model = model;
      this.scene.add(model);
      this.onLoaded?.();
      this.map?.triggerRepaint();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load GLB model";
      console.error("[ThreeGLBLayer] Load error:", msg);
      this.onError?.(msg);
    }
  }
}
