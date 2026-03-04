import { updatePlacement } from "@/lib/onsite/state";
import { DEFAULT_PLACEMENT } from "@/lib/onsite/config";
import type { PlacementTransform, Coords } from "@/lib/onsite/types";

export interface Model3DState {
  transform: PlacementTransform;
  ghostAnchor: Coords | null;
  modelLoaded: boolean;
}

const listeners = new Set<() => void>();

let state: Model3DState = {
  transform: DEFAULT_PLACEMENT,
  ghostAnchor: null,
  modelLoaded: false,
};

function notify() {
  listeners.forEach((l) => l());
}

export function getModel3DState(): Model3DState {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setTransform(partial: Partial<PlacementTransform>): void {
  state = {
    ...state,
    transform: updatePlacement(state.transform, partial),
  };
  notify();
}

export function setGhostAnchor(anchor: Coords | null): void {
  state = { ...state, ghostAnchor: anchor };
  notify();
}

export function setModelLoaded(loaded: boolean): void {
  state = { ...state, modelLoaded: loaded };
  notify();
}

export function initTransform(t: PlacementTransform): void {
  state = { ...state, transform: t };
  notify();
}
