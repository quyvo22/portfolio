"use client";

import { useState } from "react";
import type { GlbMapState } from "@/lib/maptiler/geo";
import { probeGlbUrl, type GlbProbeResult } from "@/lib/storage/glbProbe";

interface GlbControlsProps {
  state: GlbMapState;
  onChange: (patch: Partial<GlbMapState>) => void;
  pickingActive: boolean;
  onTogglePick: () => void;
  onResetView: () => void;
  onFullscreen: () => void;
}

export function GlbControls({
  state,
  onChange,
  pickingActive,
  onTogglePick,
  onResetView,
  onFullscreen,
}: GlbControlsProps) {
  const [urlDraft, setUrlDraft] = useState(state.url);
  const [probe, setProbe] = useState<GlbProbeResult | null>(null);
  const [probing, setProbing] = useState(false);

  const handleLoad = async () => {
    setProbing(true);
    setProbe(null);
    const result = await probeGlbUrl(urlDraft);
    setProbe(result);
    setProbing(false);
    if (result.ok) {
      onChange({ url: urlDraft });
    }
  };

  return (
    <div className="glb-controls-panel">
      <div>
        <div className="glb-section-title">Position</div>
        <label>
          Latitude
          <input
            type="number"
            step="0.000001"
            value={state.lat}
            onChange={(e) => onChange({ lat: parseFloat(e.target.value) || 0 })}
          />
        </label>
        <label>
          Longitude
          <input
            type="number"
            step="0.000001"
            value={state.lng}
            onChange={(e) => onChange({ lng: parseFloat(e.target.value) || 0 })}
          />
        </label>
        <button
          onClick={onTogglePick}
          className={pickingActive ? "btn-primary" : ""}
          style={{ marginTop: 6 }}
        >
          {pickingActive ? "Click map to set anchor…" : "Use map click"}
        </button>
      </div>

      <div>
        <div className="glb-section-title">Orientation</div>
        <label>
          <span>Heading: {state.heading}°</span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={state.heading}
            onChange={(e) => onChange({ heading: parseFloat(e.target.value) })}
          />
        </label>
        <button onClick={() => onChange({ heading: 0 })} style={{ marginTop: 4 }}>
          Set North
        </button>
      </div>

      <div>
        <div className="glb-section-title">Altitude</div>
        <label>
          <span>Offset: {state.altitude.toFixed(1)} m</span>
          <input
            type="range"
            min={-10}
            max={50}
            step={0.5}
            value={state.altitude}
            onChange={(e) => onChange({ altitude: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div>
        <div className="glb-section-title">Scale</div>
        <label>
          <span>Factor: {state.scale.toFixed(2)}×</span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={state.scale}
            onChange={(e) => onChange({ scale: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div>
        <div className="glb-section-title">GLB File</div>
        <label>
          URL (HTTPS, CORS-enabled)
          <input
            type="text"
            placeholder="https://example.com/model.glb"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
          />
        </label>
        <button
          className="btn-primary"
          onClick={handleLoad}
          disabled={probing || !urlDraft}
          style={{ marginTop: 6 }}
        >
          {probing ? "Checking…" : "Load"}
        </button>
        {probe && (
          <div className={`glb-status-msg ${probe.ok ? "ok" : "error"}`} style={{ marginTop: 6 }}>
            {probe.message}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onResetView} style={{ flex: 1 }}>
          Reset View
        </button>
        <button onClick={onFullscreen} style={{ flex: 1 }}>
          Fullscreen
        </button>
      </div>
    </div>
  );
}
