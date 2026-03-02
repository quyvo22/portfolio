export interface Coords {
  lat: number;
  lng: number;
}

export interface PlacementTransform {
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  scale: number;
}

export interface GeocodeResult {
  coords: Coords;
  formatted: string;
}

export interface ElevationResult {
  elevation: number;
  location: Coords;
}

export interface LotPolygon {
  path: Coords[];
  centroid?: Coords;
}

export interface OnsitePlacementState {
  placement: PlacementTransform | null;
  polygon: LotPolygon | null;
  ghostAnchor: Coords | null;
  mode: "edit-lot" | "place" | "confirm";
}
