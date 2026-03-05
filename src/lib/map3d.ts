import * as maptilersdk from "@maptiler/sdk";
import { Layer3D, AltitudeReference } from "@maptiler/3d";

export interface MapController {
  rotateBuilding(heading: number): void;
  scaleBuilding(value: number): void;
  moveBuilding(lngLat: { lng: number; lat: number }): void;
  toggleMapVisibility(): void;
  destroy(): void;
}

const DEFAULT_CENTER: [number, number] = [108.2208, 16.0678];
const DEFAULT_ZOOM = 18;
const DEFAULT_PITCH = 60;

export async function initMap(
  container: HTMLElement,
  modelUrl: string,
): Promise<MapController> {
  maptilersdk.config.apiKey =
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";

  const map = new maptilersdk.Map({
    container,
    style: maptilersdk.MapStyle.STREETS_V4,
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    pitch: DEFAULT_PITCH,
    bearing: 0,
  });

  return new Promise<MapController>((resolve, reject) => {
    map.on("ready", async () => {
      try {
        const layer3D = new Layer3D("3d-layer");
        map.addLayer(layer3D as unknown as maptilersdk.LayerSpecification);

        const item = await layer3D.addMeshFromURL(
          "building",
          modelUrl,
          {
            lngLat: { lng: DEFAULT_CENTER[0], lat: DEFAULT_CENTER[1] },
            heading: 0,
            scale: 1,
            altitude: 0,
            altitudeReference: AltitudeReference.GROUND,
          },
        );

        let mapVisible = true;

        const controller: MapController = {
          rotateBuilding(heading: number) {
            item.modify({ heading });
          },
          scaleBuilding(value: number) {
            item.modify({ scale: value });
          },
          moveBuilding(lngLat: { lng: number; lat: number }) {
            item.modify({ lngLat });
          },
          toggleMapVisibility() {
            mapVisible = !mapVisible;
            map.getContainer().style.visibility = mapVisible
              ? "visible"
              : "hidden";
          },
          destroy() {
            layer3D.clear();
            map.remove();
          },
        };

        map.on("click", (e) => {
          item.modify({ lngLat: e.lngLat });
        });

        resolve(controller);
      } catch (err) {
        reject(err);
      }
    });

    map.on("error", (e) => {
      reject(new Error(`Map error: ${e.error?.message ?? "unknown"}`));
    });
  });
}
