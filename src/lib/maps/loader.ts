import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { patchIntersectionObserver } from "@/lib/safe-observer";

let initialized = false;
let mapsLib: { Map: typeof google.maps.Map } | null = null;

export interface MapsLoaderOptions {
  apiKey: string;
  mapId?: string;
}

export interface MapsLoaderResult {
  maps: typeof google.maps;
  createMap: (container: HTMLElement, options: google.maps.MapOptions) => google.maps.Map;
}

export async function loadGoogleMaps({
  apiKey,
  mapId,
}: MapsLoaderOptions): Promise<MapsLoaderResult> {
  // Guard IntersectionObserver before Google Maps API loads —
  // the vector/WebGL map internally calls observe() and can crash
  // if the container element is not yet in the DOM.
  patchIntersectionObserver();

  if (!initialized) {
    setOptions({
      key: apiKey,
      v: "weekly",
      libraries: ["places", "geometry"],
    });
    initialized = true;
  }

  if (!mapsLib) {
    mapsLib = (await importLibrary("maps")) as { Map: typeof google.maps.Map };
  }

  const lib = mapsLib;

  return {
    maps: google.maps,
    createMap: (container, options) => {
      const mapOptions = { ...options, ...(mapId ? { mapId } : {}) };
      try {
        return new lib.Map(container, mapOptions);
      } catch {
        // Fallback: retry without mapId (vector map) if it caused the error
        console.warn("[maps/loader] Map creation failed with mapId, retrying without it");
        return new lib.Map(container, options);
      }
    },
  };
}
