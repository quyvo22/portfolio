"use client";

import { useEffect, useRef, useState } from "react";
import type { MapController } from "@/lib/map3d";

interface MapViewerProps {
  modelUrl?: string;
}

export function MapViewer({
  modelUrl = "/models/a.glb",
}: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heading, setHeading] = useState(0);
  const [scale, setScale] = useState(1);
  const [pickOnClick, setPickOnClick] = useState(true);
  const [lng, setLng] = useState(108.2208);
  const [lat, setLat] = useState(16.0678);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    import("@/lib/map3d").then(({ initMap }) =>
      initMap(el, modelUrl)
    ).then((ctrl) => {
      if (destroyed) { ctrl.destroy(); return; }
      controllerRef.current = ctrl;
      setLoading(false);
    }).catch((err) => {
      if (!destroyed) setError(String(err));
    });

    return () => {
      destroyed = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, [modelUrl]);

  function onHeadingChange(v: number) {
    setHeading(v);
    controllerRef.current?.rotateBuilding(v);
  }

  function onScaleChange(v: number) {
    setScale(v);
    controllerRef.current?.scaleBuilding(v);
  }

  function onMove() {
    controllerRef.current?.moveBuilding({ lng, lat });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Control panel */}
      <div className="w-full lg:w-72 shrink-0 space-y-4 p-4 bg-surface-raised rounded-lg border border-border">
        <h3 className="font-semibold text-sm">Controls</h3>

        {/* Heading */}
        <label className="block text-xs text-ink-muted">
          Heading: {heading}°
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={heading}
            onChange={(e) => onHeadingChange(Number(e.target.value))}
            className="w-full mt-1"
          />
        </label>

        {/* Scale */}
        <label className="block text-xs text-ink-muted">
          Scale: {scale.toFixed(1)}x
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={scale}
            onChange={(e) => onScaleChange(Number(e.target.value))}
            className="w-full mt-1"
          />
        </label>

        {/* Coordinates */}
        <div className="space-y-2">
          <label className="block text-xs text-ink-muted">
            Longitude
            <input
              type="number"
              step={0.0001}
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1 text-sm bg-surface border border-border rounded"
            />
          </label>
          <label className="block text-xs text-ink-muted">
            Latitude
            <input
              type="number"
              step={0.0001}
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1 text-sm bg-surface border border-border rounded"
            />
          </label>
          <button
            onClick={onMove}
            className="w-full px-3 py-1.5 text-xs font-medium bg-primary text-white rounded hover:opacity-90 transition-opacity"
          >
            Move Building
          </button>
        </div>

        {/* Toggles */}
        <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
          <input
            type="checkbox"
            checked={pickOnClick}
            onChange={(e) => setPickOnClick(e.target.checked)}
          />
          Pick on click
        </label>

        <button
          onClick={() => controllerRef.current?.toggleMapVisibility()}
          className="w-full px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-surface-overlay transition-colors"
        >
          Toggle Map
        </button>
      </div>

      {/* Map container */}
      <div className="relative flex-1 min-h-[400px] rounded-lg overflow-hidden border border-border">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80">
            <p className="text-sm text-ink-muted animate-pulse">
              Loading map…
            </p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/80">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );
}
