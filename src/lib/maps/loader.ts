import maplibregl from "maplibre-gl";
import { MAP_CONFIG } from "@/lib/onsite/config";

export interface MapsLoaderResult {
  createMap: (
    container: HTMLElement,
    options: {
      center: { lat: number; lng: number };
      zoom?: number;
      pitch?: number;
      bearing?: number;
    }
  ) => maplibregl.Map;
}

export function loadMap(): MapsLoaderResult {
  return {
    createMap: (container, options) => {
      return new maplibregl.Map({
        container,
        style: MAP_CONFIG.style,
        center: [options.center.lng, options.center.lat],
        zoom: options.zoom ?? MAP_CONFIG.zoom,
        pitch: options.pitch ?? MAP_CONFIG.pitch,
        bearing: options.bearing ?? MAP_CONFIG.bearing,
      });
    },
  };
}
