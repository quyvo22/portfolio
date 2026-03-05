"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThreeGLBLayer } from "@/lib/three/ThreeGLBLayer";
import { MAP_CONFIG } from "@/lib/onsite/config";
import { Move, Minus, Plus } from "lucide-react";

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
  const [zoom, setZoom] = useState(MAP_CONFIG.zoom);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = new maplibregl.Map({
      container: el,
      style: MAP_CONFIG.style,
      center: [coords.lng, coords.lat],
      zoom,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      mapRef.current = map;

      const layer = new ThreeGLBLayer({
        modelUrl,
        lng: coords.lng,
        lat: coords.lat,
        debug: true,
      });

      map.addLayer(layer as maplibregl.AddLayerObject);
      layerRef.current = layer;
    });

    map.on("move", () => {
      const center = map.getCenter();
      setCoords({ lng: center.lng, lat: center.lat });
      setZoom(map.getZoom());
    });

    return () => {
      layerRef.current?.dispose();
      layerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [modelUrl]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  return (
    <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1">
      {/* Map container */}
      <div
        className="relative rounded-lg overflow-hidden border-2 border-border shadow-lg"
        style={{ width: 320, height: 240 }}
      >
        <div ref={containerRef} className="absolute inset-0" />

        {/* Crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-red-500 rounded-full opacity-50" />
          <div className="absolute w-px h-4 bg-red-500 opacity-50" />
          <div className="absolute w-4 h-px bg-red-500 opacity-50" />
        </div>

        {/* Drag hint */}
        <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
          <Move size={10} />
          Drag map to align
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex gap-1 self-end">
        <button
          onClick={handleZoomIn}
          className="p-1 bg-surface border border-border rounded hover:bg-surface-overlay"
          title="Zoom in"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-1 bg-surface border border-border rounded hover:bg-surface-overlay"
          title="Zoom out"
        >
          <Minus size={14} />
        </button>
      </div>
    </div>
  );
}
