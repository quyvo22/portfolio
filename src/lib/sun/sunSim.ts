import type * as THREE from "three";
import type { SunState } from "@/components/maps/SunControls";
import { updateDirectionalLight } from "@/components/maps/Lights";

export interface SunSimConfig {
  lat: number;
  lng: number;
  lowEnd: boolean;
}

export interface SunSimHandle {
  update: (sunState: SunState) => void;
  updateLocation: (lat: number, lng: number) => void;
  setLowEnd: (lowEnd: boolean) => void;
  dispose: () => void;
}

export function createSunSim(
  directionalLight: THREE.DirectionalLight,
  config: SunSimConfig,
  onUpdate?: () => void
): SunSimHandle {
  let lat = config.lat;
  let lng = config.lng;
  let lowEnd = config.lowEnd;

  function update(sunState: SunState) {
    updateDirectionalLight(directionalLight, {
      lat,
      lng,
      date: sunState.date,
      hour: sunState.hour,
      lowEnd,
    });
    onUpdate?.();
  }

  function updateLocation(newLat: number, newLng: number) {
    lat = newLat;
    lng = newLng;
  }

  function setLowEnd(val: boolean) {
    lowEnd = val;
    directionalLight.castShadow = !val;
  }

  function dispose() {
    // Reserved for future cleanup
  }

  return { update, updateLocation, setLowEnd, dispose };
}
