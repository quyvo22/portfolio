import * as THREE from "three";
import { getSunDirection, sunPositionToDirection, type SunPosition } from "@/lib/solar";

export interface LightsConfig {
  lat: number;
  lng: number;
  date: Date;
  hour: number;
  lowEnd?: boolean;
}

export function createLights(config: LightsConfig): THREE.Light[] {
  const lights: THREE.Light[] = [];

  const dateWithTime = new Date(config.date);
  dateWithTime.setHours(Math.floor(config.hour));
  dateWithTime.setMinutes((config.hour % 1) * 60);

  const sunPos = getSunDirection(config.lat, config.lng, dateWithTime);
  const [x, y, z] = sunPositionToDirection(sunPos);

  const sunIntensity = Math.max(0.1, Math.sin(sunPos.elevation * (Math.PI / 180))) * 0.8;

  const directional = new THREE.DirectionalLight(0xfff5e6, sunIntensity);
  directional.position.set(x * 100, y * 100, z * 100);

  if (!config.lowEnd) {
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 500;
    directional.shadow.camera.left = -50;
    directional.shadow.camera.right = 50;
    directional.shadow.camera.top = 50;
    directional.shadow.camera.bottom = -50;
  }

  lights.push(directional);

  const ambientIntensity = config.lowEnd ? 0.4 : 0.5;
  const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
  lights.push(ambient);

  const hemisphereIntensity = config.lowEnd ? 0 : 0.3;
  if (hemisphereIntensity > 0) {
    const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, hemisphereIntensity);
    lights.push(hemisphere);
  }

  return lights;
}

export function updateDirectionalLight(
  light: THREE.DirectionalLight,
  config: LightsConfig
): void {
  const dateWithTime = new Date(config.date);
  dateWithTime.setHours(Math.floor(config.hour));
  dateWithTime.setMinutes((config.hour % 1) * 60);

  const sunPos = getSunDirection(config.lat, config.lng, dateWithTime);
  const [x, y, z] = sunPositionToDirection(sunPos);

  light.position.set(x * 100, y * 100, z * 100);

  const sunIntensity = Math.max(0.1, Math.sin(sunPos.elevation * (Math.PI / 180))) * 0.8;
  light.intensity = sunIntensity;
}
