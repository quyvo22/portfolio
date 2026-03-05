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
  private worldGroup = new THREE.Group();
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

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;

    // ── FIX 1: share MapLibre's context, never create a new one ──
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting — added to scene root (not worldGroup) so positions are stable
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(5, 10, 7.5);
    this.scene.add(dir);

    // worldGroup holds everything positioned in Mercator space
    this.scene.add(this.worldGroup);

    // ── FIX 4: debug cube (20 m) at anchor ──
    if (this.debug) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      cube.position.set(0, 10, 0);
      this.worldGroup.add(cube);
      console.log("[ThreeGLBLayer] Debug: 20m red cube added at anchor");
    }

    this.loadModel();
  }

  // ── FIX 2: camera gets raw MVP, no multiply ──
  // Mercator transform is on worldGroup, not on camera
  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput) {
    if (!this.renderer) return;

    // Position worldGroup at Mercator anchor every frame
    const anchor = maplibregl.MercatorCoordinate.fromLngLat([this.lng, this.lat], 0);
    const s = anchor.meterInMercatorCoordinateUnits();
    this.worldGroup.position.set(anchor.x, anchor.y, anchor.z ?? 0);
    this.worldGroup.scale.set(s, -s, s);

    // Camera uses MVP directly — MapLibre already computed it
    const m = new THREE.Matrix4().fromArray(
      args.modelViewProjectionMatrix as unknown as number[],
    );
    this.camera.projectionMatrix = m;

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map!.triggerRepaint();
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
          reject,
        );
      });

      const model = gltf.scene as THREE.Object3D;

      // Measure raw size
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);
      console.log("[ThreeGLBLayer] Raw model size:", {
        x: rawSize.x.toFixed(2),
        y: rawSize.y.toFixed(2),
        z: rawSize.z.toFixed(2),
      });

      // Revit mm → m auto-conversion
      if (rawSize.x > 1000 || rawSize.y > 1000 || rawSize.z > 1000) {
        model.scale.setScalar(0.001);
        console.log("[ThreeGLBLayer] Applied mm→m scaling (0.001)");
      }

      // User scale
      if (this.modelScale !== 1) {
        model.scale.multiplyScalar(this.modelScale);
      }

      // Heading
      model.rotation.y = THREE.MathUtils.degToRad(this.heading);

      // Center model, bottom at y=0
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      const finalBox = new THREE.Box3().setFromObject(model);
      model.position.y -= finalBox.min.y;

      // Debug
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);
      console.log("[ThreeGLBLayer] Model ready:", {
        finalSize: {
          x: finalSize.x.toFixed(2),
          y: finalSize.y.toFixed(2),
          z: finalSize.z.toFixed(2),
        },
        mercatorScale: maplibregl.MercatorCoordinate.fromLngLat(
          [this.lng, this.lat], 0,
        ).meterInMercatorCoordinateUnits(),
        anchor: { lng: this.lng, lat: this.lat },
        wasMillimeters: rawSize.x > 1000 || rawSize.y > 1000 || rawSize.z > 1000,
      });

      // Add to worldGroup (already positioned in Mercator space)
      this.model = model;
      this.worldGroup.add(model);
      this.onLoaded?.();
      this.map?.triggerRepaint();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load GLB model";
      console.error("[ThreeGLBLayer] Load error:", msg);
      this.onError?.(msg);
    }
  }
}
