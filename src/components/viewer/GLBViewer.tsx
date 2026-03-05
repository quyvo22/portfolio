"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, MapPinOff } from "lucide-react";
import type { MapController, ModelInstance } from "@/lib/map3d";

interface GLBViewerProps {
  url: string;
}

export function GLBViewer({ url }: GLBViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);
  const initedRef = useRef(false);

  const [showMap, setShowMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [coords, setCoords] = useState({ lng: 108.2208, lat: 16.0678 });

  useEffect(() => {
    if (!showMap) return;
    if (initedRef.current) return;
    const el = mapContainerRef.current;
    if (!el) return;

    initedRef.current = true;

    import("@/lib/map3d")
      .then(({ initMap }) => initMap(el))
      .then(async (ctrl) => {
        controllerRef.current = ctrl;

        const inst: ModelInstance = {
          id: "glb-viewer-model",
          name: "Building",
          url,
          lng: 108.2208,
          lat: 16.0678,
          altitude: 0,
          scale: 1,
          heading: 0,
        };
        await ctrl.addModel(inst);

        ctrl.setClickHandler((lngLat) => {
          ctrl.modifyModel("glb-viewer-model", {
            lng: lngLat.lng,
            lat: lngLat.lat,
          });
          setCoords({ lng: lngLat.lng, lat: lngLat.lat });
        });

        setMapReady(true);
      })
      .catch((err) => {
        console.error("GLBViewer map init failed:", err);
      });

    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
      initedRef.current = false;
      setMapReady(false);
    };
  }, [showMap, url]);

  const toggleMap = useCallback(() => {
    setShowMap((v) => !v);
  }, []);

  return (
    <div className="flex flex-col">
      <button
        onClick={toggleMap}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b border-border transition-colors ${
          showMap
            ? "bg-accent/10 text-accent"
            : "bg-surface text-ink-muted hover:bg-surface-overlay"
        }`}
      >
        {showMap ? <MapPinOff size={16} /> : <MapPin size={16} />}
        {showMap ? "Hide Map" : "Show Map"}
      </button>

      <div
        className="relative bg-surface-overlay"
        style={{
          height: showMap ? 400 : 0,
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div ref={mapContainerRef} className="absolute inset-0" />

        {showMap && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-overlay z-10">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Loading map...
            </div>
          </div>
        )}

        {showMap && mapReady && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono z-10">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
        )}

        {showMap && mapReady && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
            Click map to reposition building
          </div>
        )}
      </div>
    </div>
  );
}
