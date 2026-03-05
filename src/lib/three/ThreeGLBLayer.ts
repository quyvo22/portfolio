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
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.Camera();
  private readonly worldGroup = new THREE.Group();
  private model: THREE.Object3D | null = null;
  private map: maplibregl.Map | null = null;

  private lng: number;
  private lat: number;
  private heading: number;
  private userScale: number;
  private modelUrl: string;
  private debug: boolean;

  private onProgress?: (pct: number) => void;
  private onError?: (msg: string) => void;
  private onLoaded?: () => void;

  constructor(opts: ThreeGLBLayerOptions) {
    this.id = opts.id ?? "glb-model";
    this.lng = opts.lng;
    this.lat = opts.lat;
    this.heading = opts.heading ?? 0;
    this.userScale = opts.scale ?? 1;
    this.modelUrl = opts.modelUrl;
    this.debug = opts.debug ?? true;
    this.onProgress = opts.onProgress;
    this.onError = opts.onError;
    this.onLoaded = opts.onLoaded;
  }

  /* ── MapLibre calls this once ── */
  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.map = map;

    // Share MapLibre's context — never create a new one
    this.renderer = new THREE.WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      antialias: true,
    });
    this.renderer.autoClear = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 10, 7.5);
    this.scene.add(sun);

    // worldGroup: positioned in Mercator space each frame
    this.scene.add(this.worldGroup);

    // Debug cube (20 m red) at anchor
    if (this.debug) {
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xff0000 }),
      );
      cube.position.set(0, 10, 0);
      this.worldGroup.add(cube);
      console.log("[GLBLayer] debug cube added");
    }

    this.loadModel();
  }

  /* ── Called every frame by MapLibre ── */
  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, args: CustomRenderMethodInput) {
    if (!this.renderer) return;

    // Position worldGroup at Mercator anchor
    const anchor = maplibregl.MercatorCoordinate.fromLngLat([this.lng, this.lat], 0);
    const s = anchor.meterInMercatorCoordinateUnits();
    this.worldGroup.position.set(anchor.x, anchor.y, anchor.z ?? 0);
    this.worldGroup.scale.set(s, -s, s);

    // Camera gets raw MVP — no multiply
    this.camera.projectionMatrix.fromArray(
      args.modelViewProjectionMatrix as unknown as number[],
    );

    this.renderer.resetState();
    this.renderer.render(this.scene, this.camera);
    this.map!.triggerRepaint();
  }

  setTransform(lat: number, lng: number, heading: number, scale: number) {
    this.lat = lat;
    this.lng = lng;
    this.heading = heading;
    this.userScale = scale;
    if (this.model) {
      this.model.rotation.y = THREE.MathUtils.degToRad(heading);
    }
    this.map?.triggerRepaint();
  }

  dispose() {
    if (this.map?.getLayer(this.id)) this.map.removeLayer(this.id);
    this.renderer = null;
    this.map = null;
  }

  /* ── Load GLB ── */
  private async loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf: any = await new Promise((resolve, reject) => {
        loader.load(this.modelUrl, resolve,
          (xhr) => this.onProgress?.(xhr.total ? (xhr.loaded / xhr.total) * 100 : 0),
          reject,
        );
      });

      const model = gltf.scene as THREE.Object3D;

      // Measure raw
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = new THREE.Vector3();
      rawBox.getSize(rawSize);
      console.log("[GLBLayer] raw size:", rawSize.x.toFixed(1), rawSize.y.toFixed(1), rawSize.z.toFixed(1));

      // Revit mm → m
      if (rawSize.x > 1000 || rawSize.y > 1000 || rawSize.z > 1000) {
        model.scale.setScalar(0.001);
        console.log("[GLBLayer] applied mm→m (0.001)");
      }

      // User scale
      if (this.userScale !== 1) model.scale.multiplyScalar(this.userScale);

      // Heading
      model.rotation.y = THREE.MathUtils.degToRad(this.heading);

      // Center + bottom at y=0
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      const finalBox = new THREE.Box3().setFromObject(model);
      model.position.y -= finalBox.min.y;

      // Debug
      const sz = new THREE.Vector3();
      finalBox.getSize(sz);
      const anc = maplibregl.MercatorCoordinate.fromLngLat([this.lng, this.lat], 0);
      console.log("[GLBLayer] ready:", {
        size: `${sz.x.toFixed(1)} x ${sz.y.toFixed(1)} x ${sz.z.toFixed(1)}`,
        mercatorScale: anc.meterInMercatorCoordinateUnits(),
        anchor: `${this.lng}, ${this.lat}`,
        worldPos: `${anc.x.toFixed(6)}, ${anc.y.toFixed(6)}`,
      });

      this.model = model;
      this.worldGroup.add(model);
      this.onLoaded?.();
      this.map?.triggerRepaint();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load GLB";
      console.error("[GLBLayer] error:", msg);
      this.onError?.(msg);
    }
  }
}
