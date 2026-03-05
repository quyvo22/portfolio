"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThreeGLBLayer } from "@/lib/three/ThreeGLBLayer";
import { MAP_CONFIG } from "@/lib/onsite/config";

interface MapOverlayProps {
  modelUrl: string;
  lng?: number;
  lat?: number;
}

export function MapOverlay({ modelUrl, lng = 108.2208, lat = 16.0678 }: MapOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layerRef = useRef<ThreeGLBLayer | null>(null);
  const [coords, setCoords] = useState({ lng, lat });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Small delay to ensure R3F Canvas is fully unmounted and GPU is free
    const timer = setTimeout(() => {
      const map = new maplibregl.Map({
        container: el,
        style: MAP_CONFIG.style,
        center: [lng, lat],
        zoom: MAP_CONFIG.zoom,
        pitch: 0,
        bearing: 0,
      });

      map.on("load", () => {
        mapRef.current = map;
        setReady(true);

        // FIX 3: prevent duplicate layer
        if (!map.getLayer("glb-model")) {
          const layer = new ThreeGLBLayer({
            modelUrl,
            lng,
            lat,
            debug: true,
          });
          map.addLayer(layer as maplibregl.AddLayerObject);
          layerRef.current = layer;
        }
      });

      map.on("move", () => {
        const center = map.getCenter();
        setCoords({ lng: center.lng, lat: center.lat });
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      layerRef.current?.dispose();
      layerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setReady(false);
    };
  }, [modelUrl, lng, lat]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading state */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-overlay/80 z-10">
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Loading map...
          </div>
        </div>
      )}

      {/* Crosshair */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
        <div className="w-8 h-8 border-2 border-red-500 rounded-full opacity-40" />
        <div className="absolute w-px h-6 bg-red-500 opacity-40" />
        <div className="absolute w-6 h-px bg-red-500 opacity-40" />
      </div>

      {/* Coordinates */}
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono z-10">
        {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
      </div>

      {/* Hint */}
      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
        Drag map to align building to site
      </div>
    </div>
  );
}
