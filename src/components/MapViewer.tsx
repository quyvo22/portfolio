"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MapController, ModelInstance } from "@/lib/map3d";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Move,
  RotateCw,
  Maximize2,
  Mountain,
  Plus,
  Trash2,
  Box,
  MousePointerClick,
  Upload,
  Save,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react";
import { useGlbUpload } from "@/hooks/useGlbUpload";
import type { MapInitOptions } from "@/lib/map3d";
import { AddressSearch } from "@/components/AddressSearch";
import pointOnSurface from "@turf/point-on-surface";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point as turfPoint } from "@turf/helpers";

/* ── Helpers ── */
let idCounter = 0;
function nextId() {
  return `model-${++idCounter}`;
}

/* ── Props ── */
interface MapViewerProps {
  modelUrl?: string;
  sceneId?: string;
  editable?: boolean;
  onSceneSaved?: (sceneId: string) => void;
}

/* ── Default sample models ── */
const SAMPLE_MODELS = [
  {
    label: "Box Animated",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb",
  },
  {
    label: "Duck",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Duck/glTF-Binary/Duck.glb",
  },
  {
    label: "Avocado",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Avocado/glTF-Binary/Avocado.glb",
  },
];

export function MapViewer({ modelUrl, sceneId, editable = true, onSceneSaved }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  /* ── Scene save state ── */
  const [sceneName, setSceneName] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(sceneId ?? null);
  const [showSaveForm, setShowSaveForm] = useState(false);

  /* ── Multi-model state ── */
  const [models, setModels] = useState<ModelInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickOnClick, setPickOnClick] = useState(false);
  const [addingModel, setAddingModel] = useState(false);

  /* ── Add-model form ── */
  const [newModelUrl, setNewModelUrl] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  /* ── Place-mode state ── */
  const [hoverCoords, setHoverCoords] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const prevZoomRef = useRef<number | null>(null);

  /* ── Parcel-aware placement ── */
  const [selectedParcel, setSelectedParcel] = useState<GeoJSON.Feature | null>(null);
  const [outsideParcel, setOutsideParcel] = useState(false);

  /* ── GLB upload ── */
  const [uploadState, uploadActions] = useGlbUpload();
  const [uploadDragOver, setUploadDragOver] = useState(false);

  /* ── Building toggle ── */
  const buildingToggleEnabled = process.env.NEXT_PUBLIC_ENABLE_BUILDING_TOGGLE !== "false";
  const [buildingsVisible, setBuildingsVisible] = useState(true);

  const selected = models.find((m) => m.id === selectedId) ?? null;
  const addressSearchEnabled = process.env.NEXT_PUBLIC_ENABLE_ADDRESS_SEARCH !== "false";

  /* ── Place model at address location ── */
  const placeModelAt = useCallback(
    async (lng: number, lat: number) => {
      const ctrl = controllerRef.current;
      if (!ctrl) return;

      const targetId = selectedId || models[0]?.id;
      if (targetId) {
        ctrl.modifyModel(targetId, { lng, lat });
        setModels((prev) =>
          prev.map((m) => (m.id === targetId ? { ...m, lng, lat } : m)),
        );
        setSelectedId(targetId);
      } else {
        // No models — add default sample at this position
        const inst: ModelInstance = {
          id: nextId(),
          name: "Placed Model",
          url: SAMPLE_MODELS[0].url,
          lng,
          lat,
          altitude: 0,
          scale: 50,
          heading: 0,
        };
        await ctrl.addModel(inst);
        setModels((prev) => [...prev, inst]);
        setSelectedId(inst.id);
      }
    },
    [selectedId, models],
  );

  /* ── Init map — ORIGINAL pattern (proven working) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    // Step 1: If sceneId, fetch scene data first
    const scenePromise = sceneId
      ? fetch(`/api/map-scenes/${sceneId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    scenePromise
      .then((sceneData) => {
        if (destroyed) return null;

        const initOptions: MapInitOptions | undefined = sceneData
          ? {
              center: [sceneData.centerLng, sceneData.centerLat],
              zoom: sceneData.zoom,
              pitch: sceneData.pitch,
              bearing: sceneData.bearing,
            }
          : undefined;

        return import("@/lib/map3d").then(({ initMap }) =>
          initMap(el, initOptions).then((ctrl) => ({ ctrl, sceneData }))
        );
      })
      .then(async (result) => {
        if (!result || destroyed) {
          result?.ctrl.destroy();
          return;
        }
        const { ctrl, sceneData } = result;
        controllerRef.current = ctrl;
        setLoading(false);

        // Load scene models
        if (sceneData) {
          setSceneName(sceneData.name);
          try {
            const sceneModels: ModelInstance[] = JSON.parse(sceneData.models);
            const loaded: ModelInstance[] = [];
            for (const m of sceneModels) {
              try {
                await ctrl.addModel(m);
                loaded.push(m);
              } catch (err) {
                console.warn("[MapViewer] Failed to load scene model:", m.id, err);
              }
            }
            if (loaded.length > 0) {
              setModels(loaded);
              setSelectedId(loaded[0].id);
              for (const m of loaded) {
                const num = parseInt(m.id.replace("model-", ""), 10);
                if (!isNaN(num) && num >= idCounter) idCounter = num;
              }
            }
          } catch { /* invalid JSON */ }
        }
        // If a default modelUrl is passed (and no scene), auto-add it
        else if (modelUrl) {
          const inst: ModelInstance = {
            id: nextId(),
            name: modelUrl.split("/").pop()?.replace(".glb", "") ?? "Building",
            url: modelUrl,
            lng: 108.2208,
            lat: 16.0678,
            altitude: 0,
            scale: 50,
            heading: 0,
          };
          await ctrl.addModel(inst);
          setModels([inst]);
          setSelectedId(inst.id);
        }
      })
      .catch((err) => {
        if (!destroyed) setError(String(err));
      });

    return () => {
      destroyed = true;
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Place-mode: click handler, cursor, zoom, mousemove ── */
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;

    if (pickOnClick && selectedId) {
      // Enable crosshair cursor
      ctrl.setCrosshairCursor(true);

      // Auto-zoom in slightly for precision placement
      const currentZoom = ctrl.getZoom();
      if (prevZoomRef.current === null) {
        prevZoomRef.current = currentZoom;
        if (currentZoom < 19) {
          ctrl.zoomTo(Math.min(currentZoom + 1, 20));
        }
      }

      // Track mouse position for coordinate preview + inside/outside check
      ctrl.setMoveHandler((lngLat) => {
        setHoverCoords({ lng: lngLat.lng, lat: lngLat.lat });
        if (selectedParcel) {
          try {
            const pt = turfPoint([lngLat.lng, lngLat.lat]);
            const inside = booleanPointInPolygon(pt, selectedParcel as Parameters<typeof booleanPointInPolygon>[1]);
            setOutsideParcel(!inside);
          } catch {
            setOutsideParcel(false);
          }
        } else {
          setOutsideParcel(false);
        }
      });

      // Click to place
      ctrl.setClickHandler((lngLat) => {
        ctrl.modifyModel(selectedId, { lng: lngLat.lng, lat: lngLat.lat });
        setModels((prev) =>
          prev.map((m) =>
            m.id === selectedId
              ? { ...m, lng: lngLat.lng, lat: lngLat.lat }
              : m,
          ),
        );
      });
    } else {
      // Disable place mode
      ctrl.setCrosshairCursor(false);
      ctrl.setClickHandler(null);
      ctrl.setMoveHandler(null);
      setHoverCoords(null);

      // Restore previous zoom
      if (prevZoomRef.current !== null) {
        ctrl.zoomTo(prevZoomRef.current);
        prevZoomRef.current = null;
      }
    }
  }, [pickOnClick, selectedId, selectedParcel]);

  /* ── Arrow key nudge in place-mode ── */
  useEffect(() => {
    if (!pickOnClick || !selectedId) return;
    const NUDGE = 0.000001; // ~0.1m

    function handleKeyDown(e: KeyboardEvent) {
      // Skip when input/textarea focused
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      let dLng = 0;
      let dLat = 0;
      switch (e.key) {
        case "ArrowLeft": dLng = -NUDGE; break;
        case "ArrowRight": dLng = NUDGE; break;
        case "ArrowUp": dLat = NUDGE; break;
        case "ArrowDown": dLat = -NUDGE; break;
        default: return;
      }
      e.preventDefault();

      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== selectedId) return m;
          const newLng = m.lng + dLng;
          const newLat = m.lat + dLat;
          controllerRef.current?.modifyModel(selectedId, { lng: newLng, lat: newLat });
          return { ...m, lng: newLng, lat: newLat };
        }),
      );
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pickOnClick, selectedId]);

  /* ── Model actions ── */
  const addModel = useCallback(
    async (url: string, name: string) => {
      const ctrl = controllerRef.current;
      if (!ctrl) return;
      setAddingModel(true);
      try {
        const inst: ModelInstance = {
          id: nextId(),
          name: name || (url.split("/").pop()?.replace(".glb", "") ?? "Model"),
          url,
          lng: 108.2208 + (models.length * 0.0003),
          lat: 16.0678,
          altitude: 0,
          scale: 50,
          heading: 0,
        };
        await ctrl.addModel(inst);
        setModels((prev) => [...prev, inst]);
        setSelectedId(inst.id);
        setShowAddForm(false);
        setNewModelUrl("");
        setNewModelName("");
      } catch (err) {
        setError(`Failed to load model: ${err}`);
      } finally {
        setAddingModel(false);
      }
    },
    [models.length],
  );

  const removeModel = useCallback(
    (id: string) => {
      controllerRef.current?.disposeModel(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setPickOnClick(false);
      }
    },
    [selectedId],
  );

  const toggleVisibility = useCallback(
    (id: string) => {
      setModels((prev) =>
        prev.map((m) => {
          if (m.id !== id) return m;
          const newVisible = !(m.visible !== false);
          controllerRef.current?.setModelVisible(id, newVisible);
          return { ...m, visible: newVisible };
        }),
      );
    },
    [],
  );

  /* ── Save scene ── */
  const saveScene = useCallback(async () => {
    const ctrl = controllerRef.current;
    if (!ctrl || !sceneName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const center = ctrl.getCenter();
      const payload = {
        name: sceneName.trim(),
        models: JSON.stringify(models),
        centerLng: center.lng,
        centerLat: center.lat,
        zoom: ctrl.getZoom(),
        pitch: ctrl.getPitch(),
        bearing: ctrl.getBearing(),
        published: true,
      };

      const url = currentSceneId
        ? `/api/map-scenes/${currentSceneId}`
        : "/api/map-scenes";
      const method = currentSceneId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save scene");
      }

      const saved = await res.json();
      setCurrentSceneId(saved.id);
      setShowSaveForm(false);
      onSceneSaved?.(saved.id);
    } catch (err) {
      setError(`Save failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSaving(false);
    }
  }, [sceneName, models, currentSceneId, onSceneSaved]);

  /* ── Transform helpers (update both Layer3D and React state) ── */
  function updateSelected(props: Partial<ModelInstance>) {
    if (!selectedId) return;
    controllerRef.current?.modifyModel(selectedId, props);
    setModels((prev) =>
      prev.map((m) => (m.id === selectedId ? { ...m, ...props } : m)),
    );
  }

  return (
    <div className="relative w-full" style={{ height: "100%" }}>
      {/* ── Map canvas ── */}
      <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }} />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-5 py-3 bg-white/10 border border-white/20 rounded-xl">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white font-medium">Loading map…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-3 bg-red-500/20 border border-red-400/30 rounded-xl">
          <p className="text-sm text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-300 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Address Search (feature-flagged) ── */}
      {addressSearchEnabled && !loading && (
        <AddressSearch
          controller={controllerRef.current}
          onPlaceModel={placeModelAt}
          onParcelSelect={setSelectedParcel}
        />
      )}

      {/* ── Place-mode overlay: crosshair + hover coords ── */}
      {pickOnClick && selectedId && (
        <>
          {/* Center crosshair */}
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            <div className="relative">
              {/* Pulsing ring */}
              <div className="absolute -inset-4 border-2 border-blue-400/50 rounded-full animate-ping" />
              {/* Static crosshair */}
              <div className="w-6 h-6 border-2 border-blue-400 rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full" />
            </div>
          </div>

          {/* Place-mode banner */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
            <MousePointerClick size={14} className="text-white" />
            <span className="text-xs text-white font-medium">
              Click map to place &quot;{selected?.name}&quot;
            </span>
          </div>

          {/* Hover coordinates near cursor + inside/outside indicator */}
          {hoverCoords && (
            <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 backdrop-blur-sm rounded-lg ${
              outsideParcel && selectedParcel ? "bg-red-900/70" : "bg-black/70"
            }`}>
              <span className={`text-[11px] font-mono ${
                outsideParcel && selectedParcel ? "text-red-300" : "text-blue-300"
              }`}>
                {hoverCoords.lat.toFixed(6)}°N, {hoverCoords.lng.toFixed(6)}°E
                {outsideParcel && selectedParcel && (
                  <span className="ml-1.5 text-red-400">(outside parcel)</span>
                )}
              </span>
            </div>
          )}

          {/* Snap to parcel center button */}
          {selectedParcel && selectedId && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={() => {
                  try {
                    const center = pointOnSurface(selectedParcel as Parameters<typeof pointOnSurface>[0]);
                    const [lng, lat] = center.geometry.coordinates;
                    controllerRef.current?.modifyModel(selectedId, { lng, lat });
                    setModels((prev) =>
                      prev.map((m) =>
                        m.id === selectedId ? { ...m, lng, lat } : m,
                      ),
                    );
                  } catch { /* noop */ }
                }}
                className="px-3 py-1.5 text-xs font-medium bg-green-500/80 hover:bg-green-500 text-white rounded-full backdrop-blur-sm transition-colors flex items-center gap-1.5"
              >
                <MapPin size={12} />
                Snap to parcel center
              </button>
            </div>
          )}
        </>
      )}

      {/* ── LEFT panel — Transform Controls ── */}
      <div
        className={`absolute top-4 left-4 z-10 transition-transform duration-300 ${
          leftOpen ? "translate-x-0" : "-translate-x-[calc(100%-2.5rem)]"
        }`}
      >
        <div className="flex">
          <div className="w-64 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-4 text-white max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Transform Controls
            </h3>

            {selected ? (
              <>
                {/* Heading */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <RotateCw size={12} className="text-white/50" />
                    <span className="text-xs text-white/70">
                      Heading: {selected.heading}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={selected.heading}
                    onChange={(e) =>
                      updateSelected({ heading: Number(e.target.value) })
                    }
                    className="w-full accent-blue-400"
                  />
                </div>

                {/* Scale */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Maximize2 size={12} className="text-white/50" />
                    <span className="text-xs text-white/70">
                      Scale: {selected.scale.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={selected.scale}
                    onChange={(e) =>
                      updateSelected({ scale: Number(e.target.value) })
                    }
                    className="w-full accent-blue-400"
                  />
                </div>

                {/* Altitude */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Mountain size={12} className="text-white/50" />
                    <span className="text-xs text-white/70">
                      Altitude: {selected.altitude.toFixed(1)}m
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-10}
                    max={200}
                    step={0.5}
                    value={selected.altitude}
                    onChange={(e) =>
                      updateSelected({ altitude: Number(e.target.value) })
                    }
                    className="w-full accent-blue-400"
                  />
                </div>

                {/* Coordinates */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={12} className="text-white/50" />
                    <span className="text-xs text-white/70">Position</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[10px] text-white/40 uppercase">
                        Lng
                      </span>
                      <input
                        type="number"
                        step={0.0001}
                        value={selected.lng}
                        onChange={(e) =>
                          updateSelected({ lng: Number(e.target.value) })
                        }
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white/10 border border-white/10 rounded text-white focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] text-white/40 uppercase">
                        Lat
                      </span>
                      <input
                        type="number"
                        step={0.0001}
                        value={selected.lat}
                        onChange={(e) =>
                          updateSelected({ lat: Number(e.target.value) })
                        }
                        className="w-full mt-0.5 px-2 py-1 text-xs bg-white/10 border border-white/10 rounded text-white focus:border-blue-400 focus:outline-none"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() =>
                      updateSelected({ lng: selected.lng, lat: selected.lat })
                    }
                    className="w-full px-3 py-1.5 text-xs font-medium bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Move size={12} />
                    Apply Position
                  </button>
                </div>

                {/* Pick toggle */}
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer pt-2 border-t border-white/10">
                  <input
                    type="checkbox"
                    checked={pickOnClick}
                    onChange={(e) => setPickOnClick(e.target.checked)}
                    className="accent-blue-400"
                  />
                  <MousePointerClick size={12} />
                  Click map to place
                </label>
              </>
            ) : (
              <p className="text-xs text-white/40 py-4 text-center">
                Select a model to edit transforms
              </p>
            )}
          </div>

          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="self-start ml-1 mt-2 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            {leftOpen ? (
              <ChevronLeft size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        </div>
      </div>

      {/* ── RIGHT panel — Model List ── */}
      <div
        className={`absolute top-4 right-4 z-10 transition-transform duration-300 ${
          rightOpen ? "translate-x-0" : "translate-x-[calc(100%-2.5rem)]"
        }`}
      >
        <div className="flex">
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="self-start mr-1 mt-2 p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            {rightOpen ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>

          <div className="w-64 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3 text-white max-h-[calc(100vh-8rem)] overflow-y-auto">
            {/* Header + Add button */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Models ({models.length})
              </h3>
              <button
                onClick={() => setShowAddForm((v) => !v)}
                className="p-1 bg-blue-500/80 hover:bg-blue-500 rounded transition-colors"
                title="Add model"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Add model form */}
            {showAddForm && (
              <div className="space-y-2 p-3 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-[10px] text-white/50 uppercase">
                  Add New Model
                </span>

                {/* Upload GLB file */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setUploadDragOver(true); }}
                  onDragLeave={() => setUploadDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setUploadDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    const url = await uploadActions.uploadFile(file);
                    if (url) addModel(url, file.name.replace(/\.glb$/i, ""));
                  }}
                  onClick={() => !uploadState.uploading && uploadActions.inputRef.current?.click()}
                  className={`flex flex-col items-center gap-1.5 py-4 rounded-lg border border-dashed transition-colors ${
                    uploadState.uploading ? "cursor-wait" : "cursor-pointer"
                  } ${uploadDragOver ? "border-blue-400 bg-blue-400/10" : "border-white/20 hover:border-white/40"}`}
                >
                  {uploadState.uploading ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[11px] text-white/70">Uploading… {uploadState.progress}%</span>
                      <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${uploadState.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={16} className="text-white/40" />
                      <span className="text-[11px] text-white/50">Drop .glb or click to upload</span>
                    </>
                  )}
                </div>
                <input
                  ref={uploadActions.inputRef}
                  type="file"
                  accept=".glb"
                  className="hidden"
                  disabled={uploadState.uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadActions.uploadFile(file);
                    if (url) addModel(url, file.name.replace(/\.glb$/i, ""));
                  }}
                />
                {uploadState.error && (
                  <p className="text-[10px] text-red-400">{uploadState.error}</p>
                )}

                {/* Quick-add sample models */}
                <div className="space-y-1">
                  {SAMPLE_MODELS.map((s) => (
                    <button
                      key={s.label}
                      disabled={addingModel}
                      onClick={() => addModel(s.url, s.label)}
                      className="w-full text-left px-2 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Box size={12} className="text-white/40 shrink-0" />
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Custom URL */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Model name"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white/10 border border-white/10 rounded text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="GLB URL (https://...)"
                    value={newModelUrl}
                    onChange={(e) => setNewModelUrl(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white/10 border border-white/10 rounded text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    disabled={!newModelUrl || addingModel}
                    onClick={() => addModel(newModelUrl, newModelName)}
                    className="w-full px-3 py-1.5 text-xs font-medium bg-blue-500/80 hover:bg-blue-500 text-white rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    {addingModel ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Loading…
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        Add to Map
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Model list */}
            {models.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-4">
                No models on map.
                <br />
                Click + to add one.
              </p>
            ) : (
              <div className="space-y-1">
                {models.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      m.id === selectedId
                        ? "bg-blue-500/30 border border-blue-400/40"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    } ${m.visible === false ? "opacity-50" : ""}`}
                  >
                    <Box
                      size={14}
                      className={
                        m.id === selectedId
                          ? "text-blue-400 shrink-0"
                          : "text-white/40 shrink-0"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{m.name}</p>
                      <p className="text-[10px] text-white/40 font-mono">
                        {m.lng.toFixed(4)}, {m.lat.toFixed(4)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(m.id);
                      }}
                      className="p-1.5 hover:bg-white/15 rounded transition-colors shrink-0"
                      title={m.visible === false ? "Show model" : "Hide model"}
                    >
                      {m.visible === false ? (
                        <EyeOff size={14} className="text-white/50" />
                      ) : (
                        <Eye size={14} className="text-white/70" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeModel(m.id);
                      }}
                      className="p-1 hover:bg-red-500/30 rounded transition-colors shrink-0"
                      title="Remove model"
                    >
                      <Trash2 size={12} className="text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected model info */}
            {selected && (
              <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
                <h4 className="text-[10px] font-semibold uppercase text-white/50">
                  Selected: {selected.name}
                </h4>
                <div className="flex justify-between">
                  <span className="text-white/50">Heading</span>
                  <span className="text-white/80">{selected.heading}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Scale</span>
                  <span className="text-white/80">
                    {selected.scale.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Altitude</span>
                  <span className="text-white/80">
                    {selected.altitude.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Position</span>
                  <span className="text-white/80 font-mono text-[10px]">
                    {selected.lng.toFixed(4)}, {selected.lat.toFixed(4)}
                  </span>
                </div>

                {/* Reset */}
                <button
                  onClick={() =>
                    updateSelected({
                      heading: 0,
                      scale: 1,
                      altitude: 0,
                    })
                  }
                  className="w-full mt-2 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded transition-colors"
                >
                  Reset Transform
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Save Scene form (admin) ── */}
      {editable && showSaveForm && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 w-72 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-white/60">
            {currentSceneId ? "Update Scene" : "Save Scene"}
          </h4>
          <input
            type="text"
            placeholder="Scene name"
            value={sceneName}
            onChange={(e) => setSceneName(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white/10 border border-white/10 rounded text-white placeholder-white/30 focus:border-blue-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              disabled={!sceneName.trim() || saving}
              onClick={saveScene}
              className="flex-1 px-3 py-1.5 text-xs font-medium bg-green-500/80 hover:bg-green-500 text-white rounded transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={12} />
                  {currentSceneId ? "Update" : "Save"}
                </>
              )}
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/10 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom status bar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
          <span className="text-[11px] text-white/60 font-mono">
            {models.length} model{models.length !== 1 ? "s" : ""} ·{" "}
            {selected
              ? `${selected.name} — ${selected.lat.toFixed(5)}°N, ${selected.lng.toFixed(5)}°E`
              : "No selection"}
          </span>
        </div>
        {buildingToggleEnabled && (
          <button
            onClick={() => {
              const next = !buildingsVisible;
              setBuildingsVisible(next);
              controllerRef.current?.setBuildingsVisible(next);
            }}
            className={`px-3 py-2 bg-black/60 backdrop-blur-md border rounded-full transition-colors flex items-center gap-1.5 ${
              buildingsVisible
                ? "border-white/10 text-white/60 hover:text-white"
                : "border-orange-400/40 text-orange-400"
            }`}
            title={buildingsVisible ? "Hide buildings" : "Show buildings"}
          >
            <Building2 size={14} />
            <span className="text-[11px]">{buildingsVisible ? "Buildings" : "Buildings off"}</span>
          </button>
        )}
        {editable && (
          <button
            onClick={() => setShowSaveForm((v) => !v)}
            className="px-3 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
            title="Save scene"
          >
            <Save size={14} />
            <span className="text-[11px]">Save</span>
          </button>
        )}
      </div>
    </div>
  );
}
