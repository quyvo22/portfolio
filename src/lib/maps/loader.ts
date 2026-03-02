import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

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
    createMap: (container, options) =>
      new lib.Map(container, { ...options, mapId }),
  };
}
