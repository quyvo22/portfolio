/**
 * Lightweight telemetry helper.
 *
 * Migration notes:
 *   - Noop when FLAGS.TELEMETRY = false.
 *   - Dispatches CustomEvents on `window`.
 *   - To revert: set FLAGS.TELEMETRY = false.
 */

import { FLAGS } from "./3d-config";

type TelemetryEvent =
  | "3d_view_loaded"
  | "3d_view_error"
  | "3d_interaction"
  | "3d_toolbar_reset"
  | "3d_toolbar_fullscreen"
  | "3d_toolbar_toggle_wireframe"
  | "3d_toolbar_toggle_section"
  | "3d_toolbar_toggle_measure"
  | "3d_toolbar_switch_env"
  | "3d_toolbar_intensity_change"
  | "3d_toolbar_toggle_map"
  | "geocode_success"
  | "elevation_fetch"
  | "placement_confirmed"
  | "lot_drawn"
  | "map_camera_sync"
  | "model_interaction"
  | "fps_bucket";

export function emit(event: TelemetryEvent, data?: Record<string, unknown>) {
  if (!FLAGS.TELEMETRY) return;
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(event, { detail: { ...data, ts: Date.now() } })
  );
}
