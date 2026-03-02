"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pentagon, Target, Trash2 } from "lucide-react";
import type { LotPolygon, Coords } from "@/lib/onsite/types";
import { computeCentroid } from "@/lib/onsite/state";

interface LotEditorProps {
  map: google.maps.Map;
  polygon: LotPolygon | null;
  onChange: (polygon: LotPolygon | null) => void;
  onSnapToCentroid?: () => void;
  active: boolean;
}

export function LotEditor({
  map,
  polygon,
  onChange,
  onSnapToCentroid,
  active,
}: LotEditorProps) {
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const [editing, setEditing] = useState(false);
  const pathRef = useRef<Coords[]>([]);

  const createPolygon = useCallback(() => {
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
    }

    if (!polygon) return;

    const poly = new google.maps.Polygon({
      paths: polygon.path.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: "#3b82f6",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#3b82f6",
      fillOpacity: 0.2,
      editable: editing,
      draggable: false,
    });

    poly.setMap(map);
    polygonRef.current = poly;

    google.maps.event.addListener(poly.getPath(), "set_at", updatePath);
    google.maps.event.addListener(poly.getPath(), "insert_at", updatePath);
    google.maps.event.addListener(poly.getPath(), "remove_at", updatePath);
  }, [map, polygon, editing]);

  const updatePath = useCallback(() => {
    if (!polygonRef.current) return;

    const path = polygonRef.current.getPath();
    const coords: Coords[] = [];

    for (let i = 0; i < path.getLength(); i++) {
      const pt = path.getAt(i);
      coords.push({ lat: pt.lat(), lng: pt.lng() });
    }

    pathRef.current = coords;
    onChange({
      path: coords,
      centroid: computeCentroid(coords) ?? undefined,
    });
  }, [onChange]);

  useEffect(() => {
    if (!active) {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      return;
    }

    createPolygon();

    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
    };
  }, [active, createPolygon]);

  useEffect(() => {
    if (polygonRef.current && active) {
      polygonRef.current.setEditable(editing);
    }
  }, [editing, active]);

  const handleClear = useCallback(() => {
    onChange(null);
    pathRef.current = [];
    if (polygonRef.current) {
      polygonRef.current.setMap(null);
      polygonRef.current = null;
    }
  }, [onChange]);

  if (!active) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setEditing(!editing)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          editing
            ? "bg-accent/20 text-accent"
            : "bg-surface-overlay border border-border text-ink-muted hover:bg-surface"
        }`}
      >
        <Pentagon size={14} />
        {editing ? "Editing" : "Edit Lot"}
      </button>

      {polygon && onSnapToCentroid && (
        <button
          onClick={onSnapToCentroid}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-overlay border border-border rounded-lg text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink transition-colors"
        >
          <Target size={14} />
          Snap to Center
        </button>
      )}

      {polygon && (
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-overlay border border-border rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
