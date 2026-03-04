import { loadPerfProfile, savePerfProfile, type PerfProfile } from "@/lib/onsite/perf";
import { emit } from "@/lib/telemetry";

export type ViewerMode = "edit-lot" | "place" | "confirm";

export interface ViewerState {
  mode: ViewerMode;
  perfProfile: PerfProfile;
  overlayVisible: boolean;
  mapInteractionLocked: boolean;
}

const listeners = new Set<() => void>();

let state: ViewerState = {
  mode: "place",
  perfProfile: loadPerfProfile(),
  overlayVisible: true,
  mapInteractionLocked: false,
};

function notify() {
  listeners.forEach((l) => l());
}

export function getViewerState(): ViewerState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setMode(mode: ViewerMode): void {
  if (state.mode === mode) return;
  state = {
    ...state,
    mode,
    mapInteractionLocked: mode === "confirm",
  };
  emit("model_interaction", { mode });
  notify();
}

export function setPerfProfile(profile: PerfProfile): void {
  state = { ...state, perfProfile: profile };
  savePerfProfile(profile);
  notify();
}

export function setOverlayVisible(visible: boolean): void {
  state = { ...state, overlayVisible: visible };
  notify();
}

export function setMapInteractionLocked(locked: boolean): void {
  state = { ...state, mapInteractionLocked: locked };
  notify();
}

export function isLowEnd(): boolean {
  return state.perfProfile.lowEnd;
}
