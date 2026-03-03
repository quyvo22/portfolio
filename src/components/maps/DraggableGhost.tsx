"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Coords } from "@/lib/onsite/types";

interface DraggableGhostProps {
  map: maplibregl.Map;
  position: Coords | null;
  polygon: Coords[] | null;
  onPositionChange: (coords: Coords) => void;
  onConfirm?: () => void;
  draggable: boolean;
}

export function DraggableGhost({
  map,
  position,
  polygon,
  onPositionChange,
  onConfirm,
  draggable,
}: DraggableGhostProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!position) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([position.lng, position.lat]);
      markerRef.current.setDraggable(draggable);
      return;
    }

    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "rgba(59, 130, 246, 0.6)";
    el.style.border = "2px solid #ffffff";
    el.style.cursor = draggable ? "grab" : "default";

    const marker = new maplibregl.Marker({ element: el, draggable })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    markerRef.current = marker;

    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onPositionChange({ lat: lngLat.lat, lng: lngLat.lng });
    });

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map, position, draggable, onPositionChange]);

  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLngLat([position.lng, position.lat]);
    }
  }, [position]);

  return null;
}
