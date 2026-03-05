"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Home, Check, Edit3 } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ProjectTabs } from "@/components/project/ProjectTabs";
import { loadMap } from "@/lib/maps/loader";
import { ThreeGLBLayer } from "@/lib/three/ThreeGLBLayer";
import { AddressForm } from "@/components/maps/AddressForm";
import { PlacementControls } from "@/components/maps/PlacementControls";
import { LotEditor } from "@/components/maps/LotEditor";
import { DraggableGhost } from "@/components/maps/DraggableGhost";
import { ShareBar } from "@/components/maps/ShareBar";
import { UsageHints } from "@/components/maps/UsageHints";
import { DEFAULT_PLACEMENT, MAP_CONFIG } from "@/lib/onsite/config";
import {
  loadPlacementState,
  savePlacementState,
  updatePlacement,
  setPolygon,
} from "@/lib/onsite/state";
import { parsePermalink, type PermalinkState } from "@/lib/share/permalink";
import { rafThrottle } from "@/lib/utils/rafThrottle";
import type {
  OnsitePlacementState,
  GeocodeResult,
  Coords,
} from "@/lib/onsite/types";
import { useParams, useSearchParams } from "next/navigation";
import { emit } from "@/lib/telemetry";

export default function OnsitePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const DEMO_MODEL =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb";
  const modelUrl = searchParams.get("modelUrl") || DEMO_MODEL;
  const projectTitle = searchParams.get("title") || "Project";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const layerRef = useRef<ThreeGLBLayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [state, setState] = useState<OnsitePlacementState>(() =>
    loadPlacementState(slug)
  );
  const [cameraCoords, setCameraCoords] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  const placement = state.placement || DEFAULT_PLACEMENT;

  // --- Permalink restore ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const parsed = parsePermalink(window.location.href);
    if (parsed && parsed.lat && parsed.lng) {
      setState((prev) => ({
        ...prev,
        placement: updatePlacement(prev.placement, {
          lat: parsed.lat,
          lng: parsed.lng,
          altitude: parsed.alt ?? prev.placement?.altitude ?? 0,
          heading: parsed.heading ?? prev.placement?.heading ?? 0,
          scale: parsed.scale ?? prev.placement?.scale ?? 1,
        }),
        polygon: parsed.lotPolygon ?? prev.polygon,
      }));
    }
  }, []);

  // --- Persist state ---
  useEffect(() => {
    savePlacementState(slug, state);
  }, [slug, state]);

  // --- Map init ---
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    try {
      const { createMap } = loadMap();
      const map = createMap(container, {
        center: { lat: placement.lat, lng: placement.lng },
        zoom: MAP_CONFIG.zoom,
      });

      map.on("load", () => {
        setMapInstance(map);
        setLoading(false);

        // Create and add ThreeGLBLayer
        const layer = new ThreeGLBLayer({
          modelUrl,
          lng: placement.lng,
          lat: placement.lat,
          heading: placement.heading,
          scale: placement.scale,
          onProgress: setProgress,
          onError: setError,
          onLoaded: () => setProgress(100),
        });
        map.addLayer(layer);
        layerRef.current = layer;

        // Show ghost marker at initial placement
        setState((prev) => ({
          ...prev,
          ghostAnchor: prev.ghostAnchor ?? {
            lat: (prev.placement || DEFAULT_PLACEMENT).lat,
            lng: (prev.placement || DEFAULT_PLACEMENT).lng,
          },
        }));
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Failed to load map tiles");
        setLoading(false);
      });

      return () => {
        layerRef.current?.dispose();
        layerRef.current = null;
        map.remove();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize map"
      );
      setLoading(false);
    }
  }, []);

  // --- Mode engine: lock/unlock map interactions ---
  useEffect(() => {
    if (!mapInstance) return;

    if (state.mode === "confirm") {
      mapInstance.dragPan.disable();
      mapInstance.scrollZoom.disable();
      mapInstance.dragRotate.disable();
    } else {
      mapInstance.dragPan.enable();
      mapInstance.scrollZoom.enable();
      mapInstance.dragRotate.enable();
    }
  }, [state.mode, mapInstance]);

  // --- Live coordinate readout ---
  useEffect(() => {
    if (!mapInstance) return;

    const throttled = rafThrottle(() => {
      const center = mapInstance.getCenter();
      setCameraCoords({
        lat: center.lat,
        lng: center.lng,
        zoom: mapInstance.getZoom(),
      });
    });

    mapInstance.on("move", throttled.call);

    return () => {
      mapInstance.off("move", throttled.call);
      throttled.cancel();
    };
  }, [mapInstance]);

  // --- Sync placement to ThreeGLBLayer ---
  useEffect(() => {
    layerRef.current?.setTransform(
      placement.lat,
      placement.lng,
      placement.heading,
      placement.scale
    );
  }, [placement.lat, placement.lng, placement.heading, placement.scale]);

  // --- Handlers ---
  const handleGeocodeResult = useCallback(
    (result: GeocodeResult) => {
      if (!mapInstance) return;

      mapInstance.flyTo({
        center: [result.coords.lng, result.coords.lat],
        zoom: MAP_CONFIG.zoom,
        essential: true,
      });

      setState((prev) => ({
        ...prev,
        ghostAnchor: result.coords,
        placement: updatePlacement(prev.placement, {
          lat: result.coords.lat,
          lng: result.coords.lng,
        }),
      }));
    },
    [mapInstance]
  );

  const handlePlacementChange = useCallback(
    (updates: Partial<typeof placement>) => {
      setState((prev) => ({
        ...prev,
        placement: updatePlacement(prev.placement, updates),
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    setState({
      placement: DEFAULT_PLACEMENT,
      polygon: null,
      ghostAnchor: null,
      mode: "place",
    });
    if (mapInstance) {
      mapInstance.flyTo({
        center: [DEFAULT_PLACEMENT.lng, DEFAULT_PLACEMENT.lat],
      });
    }
  }, [mapInstance]);

  const getShareState = useCallback((): PermalinkState => {
    return {
      lat: placement.lat,
      lng: placement.lng,
      alt: placement.altitude,
      heading: placement.heading,
      scale: placement.scale,
      lotPolygon: state.polygon ?? undefined,
    };
  }, [placement, state.polygon]);

  const handlePolygonChange = useCallback((poly: any) => {
    setState((prev) => ({
      ...prev,
      polygon: setPolygon(poly),
    }));
    if (poly) {
      emit("lot_drawn", { points: poly.path.length });
    }
  }, []);

  const handleSnapToCentroid = useCallback(() => {
    if (!state.polygon?.centroid) return;
    setState((prev) => ({
      ...prev,
      ghostAnchor: prev.polygon!.centroid!,
      placement: updatePlacement(prev.placement, {
        lat: prev.polygon!.centroid!.lat,
        lng: prev.polygon!.centroid!.lng,
      }),
    }));
  }, [state.polygon]);

  const handleGhostDrag = useCallback((coords: Coords) => {
    setState((prev) => ({
      ...prev,
      ghostAnchor: coords,
      placement: updatePlacement(prev.placement, {
        lat: coords.lat,
        lng: coords.lng,
      }),
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!state.ghostAnchor || state.mode === "confirm") return;
    setState((prev) => ({
      ...prev,
      placement: updatePlacement(prev.placement, {
        lat: prev.ghostAnchor!.lat,
        lng: prev.ghostAnchor!.lng,
      }),
      mode: "confirm",
    }));
    emit("placement_confirmed", {
      lat: state.ghostAnchor.lat,
      lng: state.ghostAnchor.lng,
    });
  }, [state.ghostAnchor, state.mode]);

  const setMode = useCallback((mode: OnsitePlacementState["mode"]) => {
    setState((prev) => {
      if (mode === "place" && !prev.ghostAnchor && mapInstance) {
        const center = mapInstance.getCenter();
        const coords = { lat: center.lat, lng: center.lng };
        return {
          ...prev,
          mode,
          ghostAnchor: coords,
          placement: updatePlacement(prev.placement, coords),
        };
      }
      return { ...prev, mode };
    });
  }, [mapInstance]);

  if (!modelUrl) {
    return (
      <section className="grid-container py-12">
        <Link
          href={`/project/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to project
        </Link>
        <div className="card p-8 text-center">
          <MapPin size={48} className="mx-auto mb-4 text-ink-faint" />
          <h2 className="text-xl mb-2">No 3D model available</h2>
          <p className="text-ink-muted text-sm">
            Upload a 3D model to use on-site placement
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="grid-container py-12">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Quay l&#7841;i danh m&#7909;c
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{projectTitle}</h1>
        <p className="text-ink-muted text-sm">On-Site Placement</p>
      </div>

      <ProjectTabs
        slug={slug}
        modelUrl={modelUrl}
        projectTitle={projectTitle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="card overflow-hidden bg-surface-overlay relative"
            style={{ height: "600px" }}
          >
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-overlay z-10">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-ink-muted">Loading map...</p>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 bg-surface-overlay z-10">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && progress < 100 && !error && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-white">
                    Loading 3D model... {progress > 0 ? `${Math.round(progress)}%` : ""}
                  </span>
                </div>
                {progress > 0 && (
                  <div className="mt-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {mapInstance && state.ghostAnchor && (
              <DraggableGhost
                map={mapInstance}
                position={state.ghostAnchor}
                polygon={state.polygon?.path || null}
                onPositionChange={handleGhostDrag}
                onConfirm={handleConfirm}
                draggable={state.mode === "place"}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <UsageHints />

          <ShareBar state={getShareState()} onReset={handleReset} />

          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Find Location</h3>
            <AddressForm onResult={handleGeocodeResult} />
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Placement Controls</h3>
            <PlacementControls
              placement={placement}
              onChange={handlePlacementChange}
              onReset={handleReset}
            />
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3">Mode</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("edit-lot")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  state.mode === "edit-lot"
                    ? "bg-accent text-white"
                    : "bg-surface-overlay border border-border text-ink-muted hover:bg-surface"
                }`}
              >
                <Edit3 size={14} />
                Edit Lot
              </button>
              <button
                onClick={() => setMode("place")}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  state.mode === "place"
                    ? "bg-accent text-white"
                    : "bg-surface-overlay border border-border text-ink-muted hover:bg-surface"
                }`}
              >
                <Home size={14} />
                Place
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  state.mode === "confirm"
                    ? "bg-green-600 text-white"
                    : "bg-surface-overlay border border-border text-ink-muted hover:bg-surface"
                }`}
                disabled={!state.ghostAnchor}
              >
                <Check size={14} />
                Confirm
              </button>
            </div>
          </div>

          {mapInstance && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold mb-3">Lot Tools</h3>
              <LotEditor
                map={mapInstance}
                polygon={state.polygon}
                onChange={handlePolygonChange}
                onSnapToCentroid={handleSnapToCentroid}
                onExitMode={() => setMode("place")}
                active={state.mode === "edit-lot"}
              />
            </div>
          )}

          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3 text-ink-muted">
              Coordinates
            </h3>
            <div className="space-y-1 text-xs text-ink-faint font-mono">
              <div>Model Lat: {placement.lat.toFixed(6)}</div>
              <div>Model Lng: {placement.lng.toFixed(6)}</div>
              <div>Alt: {placement.altitude.toFixed(1)}m</div>
              <div>Heading: {placement.heading}&deg;</div>
              {cameraCoords && (
                <>
                  <div className="mt-2 pt-2 border-t border-border">
                    Camera:
                  </div>
                  <div>Lat: {cameraCoords.lat.toFixed(6)}</div>
                  <div>Lng: {cameraCoords.lng.toFixed(6)}</div>
                  <div>Zoom: {cameraCoords.zoom.toFixed(1)}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
