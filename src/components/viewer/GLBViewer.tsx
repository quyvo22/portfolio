"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThreeGLBLayer } from "@/lib/three/ThreeGLBLayer";
import { MapPin, MapPinOff } from "lucide-react";

/** Lightweight vector style — no satellite, no DEM, no terrain */
const MAP_STYLE = "https://demotiles.maplibre.org/style.json";

const DEFAULT_CENTER: [number, number] = [108.2208, 16.0678]; // Da Nang
const DEFAULT_ZOOM = 17;

interface GLBViewerProps {
  url: string;
}

export function GLBViewer({ url }: GLBViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const layerRef = useRef<ThreeGLBLayer | null>(null);
  const initedRef = useRef(false);

  const [showMap, setShowMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [coords, setCoords] = useState({ lng: DEFAULT_CENTER[0], lat: DEFAULT_CENTER[1] });

  /* ── Initialize map ONCE ── */
  useEffect(() => {
    if (!showMap) return;
    if (initedRef.current) return; // never reinit
    const el = mapContainerRef.current;
    if (!el) return;

    initedRef.current = true;

    const map = new maplibregl.Map({
      container: el,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
    });

    mapInstanceRef.current = map;

    map.on("load", () => {
      setMapReady(true);

      // Add layer only once
      if (!map.getLayer("glb-model")) {
        const layer = new ThreeGLBLayer({
          modelUrl: url,
          lng: DEFAULT_CENTER[0],
          lat: DEFAULT_CENTER[1],
          debug: true,
        });
        map.addLayer(layer as maplibregl.AddLayerObject);
        layerRef.current = layer;
      }
    });

    map.on("move", () => {
      const c = map.getCenter();
      setCoords({ lng: c.lng, lat: c.lat });
    });

    return () => {
      layerRef.current?.dispose();
      layerRef.current = null;
      map.remove();
      mapInstanceRef.current = null;
      initedRef.current = false;
      setMapReady(false);
    };
  }, [showMap, url]);

  /* ── Toggle ── */
  const toggleMap = useCallback(() => {
    setShowMap((v) => !v);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Toggle button */}
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

      {/* Map container — only visible when toggled */}
      <div
        className="relative bg-surface-overlay"
        style={{
          height: showMap ? 400 : 0,
          overflow: "hidden",
          transition: "height 0.3s ease",
        }}
      >
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Loading */}
        {showMap && !mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-overlay z-10">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Loading map...
            </div>
          </div>
        )}

        {/* Crosshair */}
        {showMap && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-red-500 rounded-full opacity-40" />
            <div className="absolute w-px h-6 bg-red-500 opacity-40" />
            <div className="absolute w-6 h-px bg-red-500 opacity-40" />
          </div>
        )}

        {/* Coordinates */}
        {showMap && mapReady && (
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded font-mono z-10">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </div>
        )}

        {/* Hint */}
        {showMap && mapReady && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
            Drag map to align building to site
          </div>
        )}
      </div>
    </div>
  );
}
