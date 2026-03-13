"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, X, Loader2 } from "lucide-react";
import type { MapController } from "@/lib/map3d";
import { geocode, type GeocodingResult } from "@/services/geocode";
import {
  fetchVicmapParcelsByBBOX,
  bboxAroundPoint,
  computeCentroid,
} from "@/services/vicmap";

const VICMAP_ENABLED = process.env.NEXT_PUBLIC_ENABLE_VICMAP !== "false";
const PARCEL_SOURCE = "vicmap-parcels";
const PARCEL_FILL = "vicmap-parcels-fill";
const PARCEL_FILL_HOVER = "vicmap-parcels-fill-hover";
const PARCEL_LINE = "vicmap-parcels-line";
const GHOST_MARKER_ID = "address-ghost-marker";

interface AddressSearchProps {
  controller: MapController | null;
  onPlaceModel?: (lng: number, lat: number) => void;
}

export function AddressSearch({ controller, onPlaceModel }: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingParcels, setLoadingParcels] = useState(false);
  const [centroid, setCentroid] = useState<[number, number] | null>(null);
  const [parcelCount, setParcelCount] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const markerRef = useRef<unknown>(null);

  // Debounced geocode search
  const search = useCallback(
    (q: string) => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!q.trim()) {
        setResults([]);
        setOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const ac = new AbortController();
        abortRef.current = ac;
        setSearching(true);
        try {
          const r = await geocode(q, ac.signal);
          if (!ac.signal.aborted) {
            setResults(r);
            setOpen(r.length > 0);
          }
        } catch {
          // aborted or error — ignore
        } finally {
          if (!ac.signal.aborted) setSearching(false);
        }
      }, 350);
    },
    [],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      clearParcelLayers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get raw map instance for GeoJSON operations
  function getMap(): unknown {
    return controller ? (controller as unknown as { getMapInstance(): unknown }).getMapInstance() : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type MapAny = any;

  function removeGhostMarker() {
    if (markerRef.current) {
      (markerRef.current as { remove(): void }).remove();
      markerRef.current = null;
    }
  }

  function addGhostMarker(lon: number, lat: number) {
    removeGhostMarker();
    const map = getMap() as MapAny;
    if (!map) return;
    // Dynamically import maptilersdk for Marker (already loaded client-side)
    import("@maptiler/sdk").then((sdk) => {
      const el = document.createElement("div");
      el.id = GHOST_MARKER_ID;
      el.style.cssText =
        "width:20px;height:20px;border-radius:50%;background:rgba(59,130,246,0.5);border:2px solid #3b82f6;box-shadow:0 0 8px rgba(59,130,246,0.6);pointer-events:none;";
      const marker = new sdk.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);
      markerRef.current = marker;
    });
  }

  function clearParcelLayers() {
    const map = getMap() as MapAny;
    if (!map) return;
    try {
      // Remove event listeners
      map.off?.("mousemove", PARCEL_FILL, handleParcelHover);
      map.off?.("mouseleave", PARCEL_FILL, handleParcelLeave);
      map.off?.("click", PARCEL_FILL, handleParcelClick);
      if (map.getLayer(PARCEL_FILL_HOVER)) map.removeLayer(PARCEL_FILL_HOVER);
      if (map.getLayer(PARCEL_FILL)) map.removeLayer(PARCEL_FILL);
      if (map.getLayer(PARCEL_LINE)) map.removeLayer(PARCEL_LINE);
      if (map.getSource(PARCEL_SOURCE)) map.removeSource(PARCEL_SOURCE);
    } catch {
      // layer/source may not exist
    }
    removeGhostMarker();
    setCentroid(null);
    setParcelCount(0);
  }

  function handleParcelHover(e: MapAny) {
    const map = getMap() as MapAny;
    if (!map || !e.features?.length) return;
    map.getCanvas().style.cursor = "pointer";
    // Highlight hovered feature
    map.setFilter(PARCEL_FILL_HOVER, [
      "==",
      ["get", "parcel_pfi"],
      e.features[0].properties?.parcel_pfi ?? "",
    ]);
  }

  function handleParcelLeave() {
    const map = getMap() as MapAny;
    if (!map) return;
    map.getCanvas().style.cursor = "";
    map.setFilter(PARCEL_FILL_HOVER, ["==", ["get", "parcel_pfi"], ""]);
  }

  function handleParcelClick(e: MapAny) {
    if (!e.features?.length) return;
    const feature = e.features[0];
    const c = computeCentroid(feature as GeoJSON.Feature);
    setCentroid(c);
    addGhostMarker(c[0], c[1]);
  }

  function addParcelLayers(geojson: GeoJSON.FeatureCollection) {
    const map = getMap() as MapAny;
    if (!map) return;

    clearParcelLayers();

    map.addSource(PARCEL_SOURCE, {
      type: "geojson",
      data: geojson,
    });

    // Base fill (semi-transparent)
    map.addLayer({
      id: PARCEL_FILL,
      type: "fill",
      source: PARCEL_SOURCE,
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.15,
      },
    });

    // Hover highlight fill (brighter on hover)
    map.addLayer({
      id: PARCEL_FILL_HOVER,
      type: "fill",
      source: PARCEL_SOURCE,
      paint: {
        "fill-color": "#60a5fa",
        "fill-opacity": 0.45,
      },
      filter: ["==", ["get", "parcel_pfi"], ""],
    });

    // Outline
    map.addLayer({
      id: PARCEL_LINE,
      type: "line",
      source: PARCEL_SOURCE,
      paint: {
        "line-color": "#2563eb",
        "line-width": 2,
      },
    });

    // Wire hover/click events
    map.on("mousemove", PARCEL_FILL, handleParcelHover);
    map.on("mouseleave", PARCEL_FILL, handleParcelLeave);
    map.on("click", PARCEL_FILL, handleParcelClick);
  }

  async function handleSelect(result: GeocodingResult) {
    setQuery(result.label);
    setOpen(false);
    setResults([]);

    // FlyTo location
    controller?.flyTo({ lng: result.lon, lat: result.lat }, 18);

    // Fetch Vicmap parcels
    if (VICMAP_ENABLED) {
      setLoadingParcels(true);
      try {
        const bbox = bboxAroundPoint(result.lon, result.lat);
        const fc = await fetchVicmapParcelsByBBOX(bbox);
        setParcelCount(fc.features.length);

        if (fc.features.length > 0) {
          addParcelLayers(fc);
          const c = computeCentroid(fc.features[0]);
          setCentroid(c);
          addGhostMarker(c[0], c[1]);
        } else {
          clearParcelLayers();
          setCentroid([result.lon, result.lat]);
          addGhostMarker(result.lon, result.lat);
        }
      } catch {
        clearParcelLayers();
        setCentroid([result.lon, result.lat]);
        addGhostMarker(result.lon, result.lat);
      } finally {
        setLoadingParcels(false);
      }
    } else {
      setCentroid([result.lon, result.lat]);
      addGhostMarker(result.lon, result.lat);
    }
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    clearParcelLayers();
    inputRef.current?.focus();
  }

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-80">
      {/* Search input */}
      <div className="relative">
        <div className="flex items-center bg-black/70 backdrop-blur-md border border-white/15 rounded-xl overflow-hidden">
          <Search size={14} className="ml-3 text-white/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search address..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              search(e.target.value);
            }}
            onFocus={() => results.length > 0 && setOpen(true)}
            className="flex-1 px-2 py-2.5 text-xs bg-transparent text-white placeholder-white/40 focus:outline-none"
          />
          {searching && (
            <Loader2 size={14} className="mr-2 text-blue-400 animate-spin shrink-0" />
          )}
          {query && !searching && (
            <button
              onClick={handleClear}
              className="mr-2 p-0.5 text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {open && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/80 backdrop-blur-md border border-white/15 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors flex items-start gap-2 border-b border-white/5 last:border-0"
              >
                <MapPin size={12} className="text-blue-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Parcel info + Place model button */}
      {centroid && (
        <div className="mt-2 bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-3 space-y-2">
          {loadingParcels ? (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Loader2 size={12} className="animate-spin" />
              Loading parcels...
            </div>
          ) : (
            <>
              <div className="text-[11px] text-white/50">
                {parcelCount > 0
                  ? `${parcelCount} parcel${parcelCount !== 1 ? "s" : ""} found`
                  : "No parcels found — using search location"}
              </div>
              <div className="text-[10px] text-white/40 font-mono">
                {centroid[1].toFixed(6)}°N, {centroid[0].toFixed(6)}°E
              </div>
              <button
                onClick={() => onPlaceModel?.(centroid[0], centroid[1])}
                className="w-full px-3 py-2 text-xs font-medium bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <MapPin size={12} />
                Place model here
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
