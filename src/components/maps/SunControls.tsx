"use client";

import { useState, useEffect } from "react";

export interface SunState {
  date: Date;
  hour: number;
}

interface SunControlsProps {
  onChange?: (state: SunState) => void;
  initialState?: SunState;
}

export function SunControls({ onChange, initialState }: SunControlsProps) {
  const [state, setState] = useState<SunState>(
    initialState || {
      date: new Date(),
      hour: 12,
    }
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setState((prev) => {
        const nextHour = prev.hour + 0.5;
        if (nextHour > 18) {
          setIsPlaying(false);
          return prev;
        }
        return { ...prev, hour: nextHour };
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePreset = (hour: number) => {
    setState((prev) => ({ ...prev, hour }));
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3 space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        Sun Simulation
      </h3>

      <div className="space-y-1">
        <label className="text-xs text-gray-600">Date</label>
        <input
          type="date"
          value={state.date.toISOString().split("T")[0]}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              date: new Date(e.target.value + "T12:00:00"),
            }))
          }
          className="w-full text-sm rounded border border-gray-300 px-2 py-1"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-gray-600 flex justify-between">
          <span>Time</span>
          <span className="font-mono">{state.hour.toFixed(1)}:00</span>
        </label>
        <input
          type="range"
          min="6"
          max="18"
          step="0.5"
          value={state.hour}
          onChange={(e) =>
            setState((prev) => ({ ...prev, hour: parseFloat(e.target.value) }))
          }
          className="w-full"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handlePreset(9)}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          9AM
        </button>
        <button
          onClick={() => handlePreset(12)}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          12PM
        </button>
        <button
          onClick={() => handlePreset(15)}
          className="flex-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
        >
          3PM
        </button>
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>
    </div>
  );
}
