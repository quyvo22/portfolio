"use client";

import { useState, useEffect } from "react";
import { Compass, Mountain } from "lucide-react";
import type { PlacementTransform } from "@/lib/onsite/types";
import { HEADING_STEP, ALTITUDE_STEP } from "@/lib/onsite/config";

interface PlacementControlsProps {
  placement: PlacementTransform;
  onChange: (updates: Partial<PlacementTransform>) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
}

export function PlacementControls({
  placement,
  onChange,
  onApply,
  onReset,
  className,
}: PlacementControlsProps) {
  const [heading, setHeading] = useState(placement.heading);
  const [altitude, setAltitude] = useState(placement.altitude);

  useEffect(() => {
    setHeading(placement.heading);
    setAltitude(placement.altitude);
  }, [placement.heading, placement.altitude]);

  const handleHeadingChange = (value: number) => {
    setHeading(value);
    onChange({ heading: value });
  };

  const handleAltitudeChange = (value: number) => {
    setAltitude(value);
    onChange({ altitude: value });
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Compass size={14} />
              <span>Heading</span>
            </div>
            <span className="text-xs text-ink-faint">{heading}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step={HEADING_STEP}
            value={heading}
            onChange={(e) => handleHeadingChange(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Mountain size={14} />
              <span>Altitude</span>
            </div>
            <span className="text-xs text-ink-faint">{altitude.toFixed(1)}m</span>
          </div>
          <input
            type="range"
            min="-10"
            max="50"
            step={ALTITUDE_STEP}
            value={altitude}
            onChange={(e) => handleAltitudeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 accent-accent"
          />
        </div>
      </div>

      {(onApply || onReset) && (
        <div className="flex gap-2 mt-4">
          {onReset && (
            <button
              onClick={onReset}
              className="flex-1 px-3 py-1.5 bg-surface-overlay border border-border rounded-lg text-xs font-medium text-ink-muted hover:bg-surface hover:text-ink transition-colors"
            >
              Reset
            </button>
          )}
          {onApply && (
            <button
              onClick={onApply}
              className="flex-1 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors"
            >
              Apply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
