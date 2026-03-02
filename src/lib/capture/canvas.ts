import * as THREE from "three";

export interface CaptureOptions {
  width?: number;
  height?: number;
  format?: "image/png" | "image/jpeg";
  quality?: number;
  watermark?: string;
}

export async function captureOverlay(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  options: CaptureOptions = {}
): Promise<string> {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const format = options.format || "image/png";
  const quality = options.quality || 0.95;

  const aspectRatio = width / height;

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
  }

  const originalSize = renderer.getSize(new THREE.Vector2());
  renderer.setSize(width, height, false);

  renderer.render(scene, camera);

  const canvas = renderer.domElement;
  const dataUrl = canvas.toDataURL(format, quality);

  renderer.setSize(originalSize.x, originalSize.y, false);

  if (options.watermark) {
    return addWatermark(dataUrl, options.watermark, width, height);
  }

  return dataUrl;
}

function addWatermark(
  dataUrl: string,
  text: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);

      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, height - 40, width, 40);

      ctx.fillStyle = "white";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, width / 2, height - 20);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function downloadCapture(dataUrl: string, filename = "capture.png") {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
