import * as maptilersdk from "@maptiler/sdk";
// CSS loaded via CDN <link> in src/app/maps/layout.tsx
// (npm import blocked by package exports field on production builds)
import { Layer3D, AltitudeReference } from "@maptiler/3d";

export interface ModelInstance {
  id: string;
  name: string;
  url: string;
  lng: number;
  lat: number;
  altitude: number;
  scale: number;
  heading: number;
}

export interface MapController {
  addModel(instance: ModelInstance): Promise<void>;
  removeModel(id: string): void;
  modifyModel(
    id: string,
    props: Partial<Omit<ModelInstance, "id" | "url">>,
  ): void;
  getModelIds(): string[];
  setClickHandler(handler: ((lngLat: { lng: number; lat: number }) => void) | null): void;
  setMoveHandler(handler: ((lngLat: { lng: number; lat: number }) => void) | null): void;
  zoomTo(zoom: number): void;
  getZoom(): number;
  getCenter(): { lng: number; lat: number };
  getPitch(): number;
  getBearing(): number;
  flyTo(lngLat: { lng: number; lat: number }, zoom?: number): void;
  setCrosshairCursor(enabled: boolean): void;
  getMapInstance(): unknown;
  destroy(): void;
}

const DEFAULT_CENTER: [number, number] = [108.2208, 16.0678];
const DEFAULT_ZOOM = 18;
const DEFAULT_PITCH = 60;

export interface MapInitOptions {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

export async function initMap(
  container: HTMLElement,
  options?: MapInitOptions,
): Promise<MapController> {
  maptilersdk.config.apiKey =
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY ?? "";

  const map = new maptilersdk.Map({
    container,
    style: maptilersdk.MapStyle.STREETS,
    center: options?.center ?? DEFAULT_CENTER,
    zoom: options?.zoom ?? DEFAULT_ZOOM,
    pitch: options?.pitch ?? DEFAULT_PITCH,
    bearing: options?.bearing ?? 0,
  });

  return new Promise<MapController>((resolve, reject) => {
    map.on("load", () => {
      try {
        const layer3D = new Layer3D("3d-layer");
        map.addLayer(layer3D as unknown as maptilersdk.LayerSpecification);

        let clickHandler: ((lngLat: { lng: number; lat: number }) => void) | null = null;
        let moveHandler: ((lngLat: { lng: number; lat: number }) => void) | null = null;

        map.on("click", (e) => {
          clickHandler?.(e.lngLat);
        });

        map.on("mousemove", (e) => {
          moveHandler?.(e.lngLat);
        });

        const controller: MapController = {
          async addModel(instance: ModelInstance) {
            console.log("[map3d] Adding model:", instance.id, instance.url);
            try {
              const item = await layer3D.addMeshFromURL(instance.id, instance.url, {
                lngLat: { lng: instance.lng, lat: instance.lat },
                heading: instance.heading,
                scale: instance.scale,
                altitude: instance.altitude,
                altitudeReference: AltitudeReference.GROUND,
              });
              console.log("[map3d] Model added successfully:", instance.id, item);
            } catch (err) {
              console.error("[map3d] Failed to add model:", instance.id, err);
              throw err;
            }
          },

          removeModel(id: string) {
            layer3D.removeMesh(id);
          },

          modifyModel(
            id: string,
            props: Partial<Omit<ModelInstance, "id" | "url">>,
          ) {
            const item = layer3D.getItem3D(id);
            if (!item) {
              console.warn("[map3d] modifyModel: item not found:", id);
              return;
            }

            const opts: Record<string, unknown> = {};
            if (props.heading !== undefined) opts.heading = props.heading;
            if (props.scale !== undefined) opts.scale = props.scale;
            if (props.altitude !== undefined) opts.altitude = props.altitude;
            if (props.lng !== undefined || props.lat !== undefined) {
              opts.lngLat = {
                lng: props.lng ?? 0,
                lat: props.lat ?? 0,
              };
            }
            item.modify(opts);
          },

          getModelIds() {
            return [];
          },

          setClickHandler(handler) {
            clickHandler = handler;
          },

          setMoveHandler(handler) {
            moveHandler = handler;
          },

          zoomTo(zoom: number) {
            map.zoomTo(zoom, { duration: 600 });
          },

          getZoom() {
            return map.getZoom();
          },

          getCenter() {
            const c = map.getCenter();
            return { lng: c.lng, lat: c.lat };
          },

          getPitch() {
            return map.getPitch();
          },

          getBearing() {
            return map.getBearing();
          },

          flyTo(lngLat: { lng: number; lat: number }, zoom?: number) {
            map.flyTo({
              center: [lngLat.lng, lngLat.lat],
              zoom: zoom ?? map.getZoom(),
              duration: 800,
            });
          },

          setCrosshairCursor(enabled: boolean) {
            map.getCanvas().style.cursor = enabled ? "crosshair" : "";
          },

          getMapInstance() {
            return map;
          },

          destroy() {
            layer3D.clear();
            map.remove();
          },
        };

        resolve(controller);
      } catch (err) {
        reject(err);
      }
    });

    map.on("error", (e) => {
      console.error("[map3d] Map error event:", e);
    });
  });
}
