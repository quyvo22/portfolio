"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Home, Check, Edit3 } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ProjectTabs } from "@/components/project/ProjectTabs";
import { loadMap } from "@/lib/maps/loader";
import { OnSiteCanvasWithLights } from "@/components/maps/OnSiteCanvasWithLights";
import { AddressForm } from "@/components/maps/AddressForm";
import { PlacementControls } from "@/components/maps/PlacementControls";
import { LotEditor } from "@/components/maps/LotEditor";
import { DraggableGhost } from "@/components/maps/DraggableGhost";
import { PerfPanel } from "@/components/maps/PerfPanel";
import { SunControls, type SunState } from "@/components/maps/SunControls";
import { ShareBar } from "@/components/maps/ShareBar";
import { UsageHints } from "@/components/maps/UsageHints";
import { getElevation } from "@/lib/maps/elevation";
import { DEFAULT_PLACEMENT, MAP_CONFIG } from "@/lib/onsite/config";
import {
  loadPlacementState,
  savePlacementState,
  updatePlacement,
  setPolygon,
} from "@/lib/onsite/state";
import { loadPerfProfile, type PerfProfile } from "@/lib/onsite/perf";
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
  const modelUrl = searchParams.get("modelUrl") || "";
  const projectTitle = searchParams.get("title") || "Project";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const [state, setState] = useState<OnsitePlacementState>(() =>
    loadPlacementState(slug)
  );
  const [perfProfile, setPerfProfile] = useState<PerfProfile>(
    loadPerfProfile()
  );
  const [sunState, setSunState] = useState<SunState>({
    date: new Date(),
    hour: 12,
  });
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
      if (parsed.time !== undefined) {
        setSunState((prev) => ({ ...prev, hour: parsed.time! }));
      }
      if (parsed.date) {
        setSunState((prev) => ({
          ...prev,
          date: new Date(parsed.date! + "T12:00:00"),
        }));
      }
      if (parsed.lowEnd !== undefined) {
        setPerfProfile((prev) => ({ ...prev, lowEnd: parsed.lowEnd! }));
      }
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
        pitch: perfProfile.lowEnd ? 0 : MAP_CONFIG.pitch,
        bearing: perfProfile.lowEnd ? 0 : MAP_CONFIG.bearing,
      });

      map.on("load", () => {
        setMapInstance(map);
        setLoading(false);
        // Show ghost marker at initial placement so user can drag immediately
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
        map.remove();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize map"
      );
      setLoading(false);
    }
  }, []);

  // --- A) Mode engine: lock/unlock map interactions ---
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

  // --- B) lowEnd perf → map pitch/bearing ---
  useEffect(() => {
    if (!mapInstance) return;

    if (perfProfile.lowEnd) {
      mapInstance.easeTo({ pitch: 0, bearing: 0, duration: 300 });
    } else {
      mapInstance.easeTo({
        pitch: MAP_CONFIG.pitch,
        bearing: MAP_CONFIG.bearing,
        duration: 300,
      });
    }
  }, [perfProfile.lowEnd, mapInstance]);

  // --- C) Live coordinate readout ---
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

  // --- Handlers ---
  const handleGeocodeResult = useCallback(
    async (result: GeocodeResult) => {
      if (!mapInstance) return;

      mapInstance.flyTo({
        center: [result.coords.lng, result.coords.lat],
        zoom: MAP_CONFIG.zoom,
        essential: true,
      });

      try {
        const elevResult = await getElevation(result.coords);
        setState((prev) => ({
          ...prev,
          ghostAnchor: result.coords,
          placement: updatePlacement(prev.placement, {
            lat: result.coords.lat,
            lng: result.coords.lng,
            altitude: elevResult.elevation,
          }),
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          ghostAnchor: result.coords,
          placement: updatePlacement(prev.placement, {
            lat: result.coords.lat,
            lng: result.coords.lng,
          }),
        }));
      }
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
    setSunState({ date: new Date(), hour: 12 });
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
      time: sunState.hour,
      date: sunState.date.toISOString().split("T")[0],
      lowEnd: perfProfile.lowEnd,
      lotPolygon: state.polygon ?? undefined,
    };
  }, [placement, sunState, perfProfile, state.polygon]);

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
    setState((prev) => ({ ...prev, mode }));
  }, []);

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
        <ArrowLeft size={14} /> Quay lại danh mục
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
            className="card overflow-hidden bg-surface-overlay"
            style={{ height: "600px" }}
          >
            {loading && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-ink-muted">Loading map...</p>
              </div>
            )}

            {error && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-red-500">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div ref={mapContainerRef} className="w-full h-full" />

            {mapInstance && modelUrl && (
              <>
                <OnSiteCanvasWithLights
                  map={mapInstance}
                  modelUrl={modelUrl}
                  placement={placement}
                  ghostAnchor={state.ghostAnchor}
                  perfProfile={perfProfile}
                  sunState={sunState}
                  enableSun={true}
                  onProgress={setProgress}
                  onError={setError}
                />
                {state.ghostAnchor && (
                  <DraggableGhost
                    map={mapInstance}
                    position={state.ghostAnchor}
                    polygon={state.polygon?.path || null}
                    onPositionChange={handleGhostDrag}
                    onConfirm={handleConfirm}
                    draggable={state.mode === "place"}
                  />
                )}
              </>
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

          <PerfPanel onChange={setPerfProfile} />

          <SunControls onChange={setSunState} initialState={sunState} />

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
