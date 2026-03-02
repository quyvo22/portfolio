import type { PlacementTransform, LotPolygon } from "@/lib/onsite/types";

export interface PermalinkState {
  lat: number;
  lng: number;
  alt: number;
  heading: number;
  scale: number;
  time?: number;
  date?: string;
  lowEnd?: boolean;
  lotPolygon?: LotPolygon;
}

export function buildPermalink(
  state: PermalinkState,
  baseUrl?: string
): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "");

  const params = new URLSearchParams();

  params.set("lat", state.lat.toFixed(6));
  params.set("lng", state.lng.toFixed(6));
  params.set("alt", state.alt.toFixed(2));
  params.set("h", state.heading.toFixed(0));
  params.set("s", state.scale.toFixed(2));

  if (state.time !== undefined) {
    params.set("t", state.time.toFixed(1));
  }

  if (state.date) {
    params.set("d", state.date);
  }

  if (state.lowEnd) {
    params.set("le", "1");
  }

  if (state.lotPolygon) {
    const encoded = encodeLotPolygon(state.lotPolygon);
    params.set("lot", encoded);
  }

  return `${base}?${params.toString()}`;
}

export function parsePermalink(url: string | URL): Partial<PermalinkState> | null {
  try {
    const parsed = typeof url === "string" ? new URL(url) : url;
    const params = parsed.searchParams;

    const state: Partial<PermalinkState> = {};

    if (params.has("lat")) state.lat = parseFloat(params.get("lat")!);
    if (params.has("lng")) state.lng = parseFloat(params.get("lng")!);
    if (params.has("alt")) state.alt = parseFloat(params.get("alt")!);
    if (params.has("h")) state.heading = parseFloat(params.get("h")!);
    if (params.has("s")) state.scale = parseFloat(params.get("s")!);
    if (params.has("t")) state.time = parseFloat(params.get("t")!);
    if (params.has("d")) state.date = params.get("d")!;
    if (params.has("le")) state.lowEnd = params.get("le") === "1";
    if (params.has("lot")) state.lotPolygon = decodeLotPolygon(params.get("lot")!);

    return state;
  } catch (e) {
    console.warn("Failed to parse permalink:", e);
    return null;
  }
}

function encodeLotPolygon(polygon: LotPolygon): string {
  const coords = polygon.path.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join(";");
  return btoa(coords);
}

function decodeLotPolygon(encoded: string): LotPolygon | undefined {
  try {
    const decoded = atob(encoded);
    const path = decoded.split(";").map(pair => {
      const [lat, lng] = pair.split(",").map(parseFloat);
      return { lat, lng };
    });
    return { path };
  } catch (e) {
    console.warn("Failed to decode lot polygon:", e);
    return undefined;
  }
}
