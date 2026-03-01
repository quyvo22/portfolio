/**
 * Lightweight telemetry helper.
 *
 * Migration notes:
 *   - Noop by default (FLAGS.TELEMETRY = false).
 *   - When enabled, dispatches CustomEvents on `window`.
 *   - To hook into analytics: listen for "3d_*" events or replace `emit`.
 *   - To revert: set FLAGS.TELEMETRY = false. No other changes needed.
 */

import { FLAGS } from "./3d-config";

type TelemetryEvent =
  | "3d_view_loaded"
  | "3d_view_error"
  | "3d_interaction";

export function emit(event: TelemetryEvent, data?: Record<string, unknown>) {
  if (!FLAGS.TELEMETRY) return;
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(event, { detail: { ...data, ts: Date.now() } })
  );
}
