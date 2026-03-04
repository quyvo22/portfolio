"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Pentagon, Target, Trash2 } from "lucide-react";
import type { LotPolygon, Coords } from "@/lib/onsite/types";
import { computeCentroid } from "@/lib/onsite/state";
import {
  createLotEditController,
  type LotEditController,
} from "@/lib/maps/lotEdit";

const SOURCE_ID = "lot-polygon-source";
const FILL_LAYER_ID = "lot-polygon-fill";
const LINE_LAYER_ID = "lot-polygon-line";

interface LotEditorProps {
  map: maplibregl.Map;
  polygon: LotPolygon | null;
  onChange: (polygon: LotPolygon | null) => void;
  onSnapToCentroid?: () => void;
  onExitMode?: () => void;
  active: boolean;
}

function coordsToGeoJSON(path: Coords[]): GeoJSON.Feature<GeoJSON.Polygon> {
  const ring = [...path.map((p) => [p.lng, p.lat] as [number, number])];
  if (ring.length > 0) ring.push(ring[0]); // close ring
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

export function LotEditor({
  map,
  polygon,
  onChange,
  onSnapToCentroid,
  onExitMode,
  active,
}: LotEditorProps) {
  const [editing, setEditing] = useState(false);
  const vertexMarkersRef = useRef<maplibregl.Marker[]>([]);
  const controllerRef = useRef<LotEditController | null>(null);

  const clearVertexMarkers = useCallback(() => {
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
  }, []);

  const updateSource = useCallback(
    (path: Coords[] | null) => {
      const source = map.getSource(SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;

      if (!path || path.length < 3) {
        source.setData({ type: "FeatureCollection", features: [] });
        return;
      }
      source.setData(coordsToGeoJSON(path));
    },
    [map]
  );

  const syncVertexMarkers = useCallback(
    (path: Coords[]) => {
      clearVertexMarkers();
      if (!editing || !path.length) return;

      const markers = path.map((coord, i) => {
        const el = document.createElement("div");
        el.style.width = "10px";
        el.style.height = "10px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = "#3b82f6";
        el.style.border = "2px solid #ffffff";
        el.style.cursor = "grab";

        const marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat([coord.lng, coord.lat])
          .addTo(map);

        marker.on("dragstart", () => {
          controllerRef.current?.onVertexDragStart();
        });

        marker.on("dragend", () => {
          controllerRef.current?.onVertexDragEnd();
          const lngLat = marker.getLngLat();
          const newPath = [...path];
          newPath[i] = { lat: lngLat.lat, lng: lngLat.lng };
          updateSource(newPath);
          onChange({
            path: newPath,
            centroid: computeCentroid(newPath) ?? undefined,
          });
        });

        return marker;
      });

      vertexMarkersRef.current = markers;
    },
    [map, editing, clearVertexMarkers, updateSource, onChange]
  );

  // Lot edit controller lifecycle
  useEffect(() => {
    if (!active) {
      controllerRef.current?.detach();
      controllerRef.current = null;
      return;
    }

    const controller = createLotEditController(map, {
      onEscape: () => {
        setEditing(false);
        onExitMode?.();
      },
      onDeleteLastVertex: () => {
        if (!polygon || polygon.path.length === 0) return;
        const newPath = polygon.path.slice(0, -1);
        if (newPath.length < 3) {
          onChange(null);
        } else {
          onChange({
            path: newPath,
            centroid: computeCentroid(newPath) ?? undefined,
          });
        }
      },
    });

    controller.attach();
    controllerRef.current = controller;

    return () => {
      controller.detach();
      controllerRef.current = null;
    };
  }, [active, map, polygon, onChange, onExitMode]);

  // Add/remove source and layers
  useEffect(() => {
    if (!active) {
      clearVertexMarkers();
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      return;
    }

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }

    if (!map.getLayer(FILL_LAYER_ID)) {
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.2,
        },
      });
    }

    if (!map.getLayer(LINE_LAYER_ID)) {
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#3b82f6",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });
    }

    if (polygon) {
      updateSource(polygon.path);
      syncVertexMarkers(polygon.path);
    }

    return () => {
      clearVertexMarkers();
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [
    active,
    map,
    polygon,
    updateSource,
    syncVertexMarkers,
    clearVertexMarkers,
  ]);

  // Sync editing state with vertex markers
  useEffect(() => {
    if (active && polygon) {
      syncVertexMarkers(polygon.path);
    } else {
      clearVertexMarkers();
    }
  }, [editing, active, polygon, syncVertexMarkers, clearVertexMarkers]);

  const handleClear = useCallback(() => {
    onChange(null);
    clearVertexMarkers();
    updateSource(null);
  }, [onChange, clearVertexMarkers, updateSource]);

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
