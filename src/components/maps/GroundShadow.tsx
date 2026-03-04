import * as THREE from "three";

export interface GroundShadowConfig {
  size?: number;
  opacity?: number;
  blur?: number;
  lowEnd?: boolean;
}

export function createGroundShadow(config: GroundShadowConfig = {}): THREE.Mesh {
  const size = config.size || 20;
  const opacity = config.opacity || 0.3;
  const blur = config.lowEnd ? 8 : (config.blur || 16);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create canvas context");

  canvas.width = 128;
  canvas.height = 128;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.NormalBlending,
    premultipliedAlpha: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.01;
  mesh.receiveShadow = false;

  return mesh;
}
