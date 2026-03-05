"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ThreeGLBLayer } from "@/lib/three/ThreeGLBLayer";

const DEFAULT_MODEL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb";

const DEFAULT_LNG = 108.2208;
const DEFAULT_LAT = 16.0678;

export default function GlbOnMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const layerRef = useRef<ThreeGLBLayer | null>(null);

  const [modelUrl, setModelUrl] = useState(DEFAULT_MODEL);
  const [lng, setLng] = useState(DEFAULT_LNG);
  const [lat, setLat] = useState(DEFAULT_LAT);
  const [heading, setHeading] = useState(0);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          "carto-positron": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
              "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
              "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "carto-positron",
            type: "raster",
            source: "carto-positron",
          },
        ],
      },
      center: [DEFAULT_LNG, DEFAULT_LAT],
      zoom: 18,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      mapRef.current = map;

      if (!map.getLayer("glb-model")) {
        const layer = new ThreeGLBLayer({
          modelUrl: DEFAULT_MODEL,
          lng: DEFAULT_LNG,
          lat: DEFAULT_LAT,
          onProgress: setProgress,
          onError: setError,
          onLoaded: () => {
            setProgress(100);
            setLoading(false);
          },
        });

        map.addLayer(layer as maplibregl.AddLayerObject);
        layerRef.current = layer;
      }
    });

    map.on("error", (e) => {
      console.error("Map error:", e);
      setError("Failed to load map tiles");
      setLoading(false);
    });

    return () => {
      layerRef.current?.dispose();
      layerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Update layer when controls change
  const applyTransform = useCallback(() => {
    layerRef.current?.setTransform(lat, lng, heading, scale);
  }, [lat, lng, heading, scale]);

  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-surface border-r border-border p-4 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-bold">GLB on Map</h2>

        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">
            Model URL
          </label>
          <input
            type="text"
            value={modelUrl}
            onChange={(e) => setModelUrl(e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-border rounded bg-surface-overlay"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-surface-overlay"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="w-full px-2 py-1.5 text-xs border border-border rounded bg-surface-overlay"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">
            Heading: {heading}&deg;
          </label>
          <input
            type="range"
            min="0"
            max="360"
            step="15"
            value={heading}
            onChange={(e) => setHeading(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1">
            Scale: {scale.toFixed(1)}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {loading && progress < 100 && !error && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white px-4 py-2 rounded text-xs">
            Loading model... {progress > 0 ? `${Math.round(progress)}%` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
