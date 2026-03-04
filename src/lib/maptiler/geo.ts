export interface GlbMapState {
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  scale: number;
  url: string;
}

export const DEFAULT_GLB_STATE: GlbMapState = {
  lat: 10.762622,
  lng: 106.660172,
  altitude: 0,
  heading: 0,
  scale: 1,
  url: "",
};

export function stateToParams(state: GlbMapState): URLSearchParams {
  const p = new URLSearchParams();
  p.set("lat", state.lat.toFixed(6));
  p.set("lng", state.lng.toFixed(6));
  p.set("alt", state.altitude.toFixed(2));
  p.set("h", state.heading.toFixed(0));
  p.set("s", state.scale.toFixed(2));
  if (state.url) p.set("url", state.url);
  return p;
}

export function paramsToState(params: URLSearchParams): Partial<GlbMapState> {
  const s: Partial<GlbMapState> = {};
  if (params.has("lat")) s.lat = parseFloat(params.get("lat")!);
  if (params.has("lng")) s.lng = parseFloat(params.get("lng")!);
  if (params.has("alt")) s.altitude = parseFloat(params.get("alt")!);
  if (params.has("h")) s.heading = parseFloat(params.get("h")!);
  if (params.has("s")) s.scale = parseFloat(params.get("s")!);
  if (params.has("url")) s.url = params.get("url")!;
  return s;
}

export function persistToUrl(state: GlbMapState) {
  if (typeof window === "undefined") return;
  const params = stateToParams(state);
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, "", newUrl);
}

export function restoreFromUrl(): GlbMapState {
  if (typeof window === "undefined") return { ...DEFAULT_GLB_STATE };
  const params = new URLSearchParams(window.location.search);
  return { ...DEFAULT_GLB_STATE, ...paramsToState(params) };
}
