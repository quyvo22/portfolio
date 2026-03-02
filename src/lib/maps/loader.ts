import { Loader } from "@googlemaps/js-api-loader";

let loaderInstance: Loader | null = null;
let mapsLibrary: typeof google.maps | null = null;

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
  if (!mapsLibrary) {
    if (!loaderInstance) {
      loaderInstance = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places", "geometry"],
      });
    }

    await loaderInstance.load();
    mapsLibrary = google.maps;
  }

  const lib = mapsLibrary;

  return {
    maps: lib,
    createMap: (container, options) =>
      new lib.Map(container, { ...options, mapId }),
  };
}
