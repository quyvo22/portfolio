"use client";

import { useEffect, useRef, useCallback } from "react";
import { Home } from "lucide-react";
import type { Coords } from "@/lib/onsite/types";

interface DraggableGhostProps {
  map: google.maps.Map;
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
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!position) return;

    if (markerRef.current) {
      markerRef.current.setPosition(position);
      markerRef.current.setDraggable(draggable);
      return;
    }

    const marker = new google.maps.Marker({
      position,
      map,
      draggable,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 0.6,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Drag to place model",
    });

    markerRef.current = marker;

    google.maps.event.addListener(marker, "dragend", () => {
      const pos = marker.getPosition();
      if (pos) {
        onPositionChange({ lat: pos.lat(), lng: pos.lng() });
      }
    });

    return () => {
      marker.setMap(null);
    };
  }, [map, position, draggable, onPositionChange]);

  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setPosition(position);
    }
  }, [position]);

  return null;
}
