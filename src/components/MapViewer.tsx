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
} from "lucide-react";

/* ── Helpers ── */
let idCounter = 0;
function nextId() {
  return `model-${++idCounter}`;
}

/* ── Props ── */
interface MapViewerProps {
  modelUrl?: string;
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

export function MapViewer({ modelUrl }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

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

  const selected = models.find((m) => m.id === selectedId) ?? null;

  /* ── Init map (no model loaded by default) ── */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;

    import("@/lib/map3d")
      .then(({ initMap }) => initMap(el))
      .then(async (ctrl) => {
        if (destroyed) {
          ctrl.destroy();
          return;
        }
        controllerRef.current = ctrl;
        setLoading(false);

        // If a default modelUrl is passed, auto-add it
        if (modelUrl) {
          const inst: ModelInstance = {
            id: nextId(),
            name: modelUrl.split("/").pop()?.replace(".glb", "") ?? "Building",
            url: modelUrl,
            lng: 108.2208,
            lat: 16.0678,
            altitude: 0,
            scale: 1,
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

      // Track mouse position for coordinate preview
      ctrl.setMoveHandler((lngLat) => {
        setHoverCoords({ lng: lngLat.lng, lat: lngLat.lat });
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
          scale: 1,
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
      controllerRef.current?.removeModel(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) {
        setSelectedId(null);
      }
    },
    [selectedId],
  );

  /* ── Transform helpers (update both Layer3D and React state) ── */
  function updateSelected(props: Partial<ModelInstance>) {
    if (!selectedId) return;
    controllerRef.current?.modifyModel(selectedId, props);
    setModels((prev) =>
      prev.map((m) => (m.id === selectedId ? { ...m, ...props } : m)),
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* ── Map canvas ── */}
      <div ref={containerRef} className="absolute inset-0" />

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

          {/* Hover coordinates near cursor */}
          {hoverCoords && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg">
              <span className="text-[11px] text-blue-300 font-mono">
                {hoverCoords.lat.toFixed(6)}°N, {hoverCoords.lng.toFixed(6)}°E
              </span>
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
                    }`}
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

      {/* ── Bottom status bar ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
        <span className="text-[11px] text-white/60 font-mono">
          {models.length} model{models.length !== 1 ? "s" : ""} ·{" "}
          {selected
            ? `${selected.name} — ${selected.lat.toFixed(5)}°N, ${selected.lng.toFixed(5)}°E`
            : "No selection"}
        </span>
      </div>
    </div>
  );
}
