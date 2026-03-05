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
  debug?: boolean;
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
  private debug: boolean;

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
    this.debug = options.debug ?? true;
    this.onProgress = options.onProgress;
    this.onError = options.onError;
    this.onLoaded = options.onLoaded;
  }

  // --- STEP 7: shared WebGL context ---
  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;

    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
    });
    this.renderer.autoClear = false;

    // Simple lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.0);
    directional.position.set(5, 10, 7.5);
    this.scene.add(directional);

    // --- STEP 8: debug red cube (20m) at anchor ---
    if (this.debug) {
      const debugCube = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: false, opacity: 0.6, transparent: true })
      );
      debugCube.position.set(0, 10, 0); // bottom at y=0
      debugCube.name = "debug-cube";
      this.scene.add(debugCube);
      console.log("[ThreeGLBLayer] Debug: 20m red cube added at anchor");
    }

    this.loadModel();
  }

  // --- STEP 5: simplified rendering ---
  // --- STEP 4: Mercator transform ---
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

      const model = gltf.scene as THREE.Object3D;

      // --- STEP 2: measure raw size, auto-detect Revit mm export ---
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);

      console.log("[ThreeGLBLayer] Raw model size:", {
        x: rawSize.x.toFixed(2),
        y: rawSize.y.toFixed(2),
        z: rawSize.z.toFixed(2),
      });

      // Revit exports in millimeters — auto-convert to meters
      if (rawSize.x > 1000 || rawSize.y > 1000 || rawSize.z > 1000) {
        model.scale.setScalar(0.001);
        console.log("[ThreeGLBLayer] Applied millimeter-to-meter scaling (0.001)");
      }

      // Apply user scale on top
      if (this.modelScale !== 1) {
        model.scale.multiplyScalar(this.modelScale);
      }

      // Apply heading
      model.rotation.y = THREE.MathUtils.degToRad(this.heading);

      // --- STEP 3: center model ---
      // Recompute box after scaling
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      // Place bottom at y=0
      const finalBox = new THREE.Box3().setFromObject(model);
      model.position.y -= finalBox.min.y;

      // Debug logging
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);
      const anchor = maplibregl.MercatorCoordinate.fromLngLat([this.lng, this.lat], 0);
      console.log("[ThreeGLBLayer] Model ready:", {
        finalSize: { x: finalSize.x.toFixed(2), y: finalSize.y.toFixed(2), z: finalSize.z.toFixed(2) },
        mercatorScale: anchor.meterInMercatorCoordinateUnits(),
        anchor: { lng: this.lng, lat: this.lat },
        wasMillimeters: rawSize.x > 1000 || rawSize.y > 1000 || rawSize.z > 1000,
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
