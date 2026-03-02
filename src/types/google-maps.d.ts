declare module "@googlemaps/three" {
  import { WebGLRenderer, Scene, Camera } from "three";

  export class ThreeJSOverlayView {
    constructor(options?: {
      map?: google.maps.Map;
      scene?: Scene;
      anchor?: google.maps.LatLngAltitudeLiteral | { lat: number; lng: number; altitude: number };
      animationMode?: string;
      upAxis?: "Y" | "Z";
    });
    setMap(map: google.maps.Map | null): void;
    requestRedraw(): void;
    onAdd(): void;
    onRemove(): void;
    onContextRestored(options: { gl: WebGLRenderingContext }): void;
    onDraw(options: { gl: WebGLRenderingContext; transformer: google.maps.CoordinateTransformer }): void;
    anchor: google.maps.LatLngAltitudeLiteral | { lat: number; lng: number; altitude: number };
    scene: Scene;
    camera: Camera;
    overlay: google.maps.WebGLOverlayView;
    latLngAltitudeToVector3(
      latLngAlt: google.maps.LatLngAltitudeLiteral | { lat: number; lng: number; altitude: number }
    ): import("three").Vector3;
  }
}

declare namespace google.maps {
  interface MapOptions {
    mapId?: string;
    tilt?: number;
    heading?: number;
  }

  class WebGLOverlayView {
    onAdd?: () => void;
    onContextRestored?: (options: {
      gl: WebGLRenderingContext;
      transformer: CoordinateTransformer;
    }) => void;
    onDraw?: (options: {
      gl: WebGLRenderingContext;
      transformer: CoordinateTransformer;
    }) => void;
    setMap(map: Map | null): void;
    requestRedraw(): void;
  }

  interface CoordinateTransformer {
    fromLatLngAltitude(
      latLngAltitude: LatLngAltitudeLiteral
    ): Float64Array;
  }

  interface LatLngAltitudeLiteral extends LatLngLiteral {
    altitude: number;
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
    ): void;
  }

  interface GeocoderRequest {
    address?: string;
    location?: LatLng | LatLngLiteral;
  }

  interface GeocoderResult {
    formatted_address: string;
    geometry: {
      location: LatLng;
    };
  }

  type GeocoderStatus = "OK" | "ZERO_RESULTS" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "INVALID_REQUEST" | "UNKNOWN_ERROR";

  class ElevationService {
    getElevationForLocations(
      request: LocationElevationRequest,
      callback: (results: ElevationResult[] | null, status: ElevationStatus) => void
    ): void;
  }

  interface LocationElevationRequest {
    locations: LatLng[] | LatLngLiteral[];
  }

  interface ElevationResult {
    elevation: number;
    location: LatLng;
  }

  type ElevationStatus = "OK" | "INVALID_REQUEST" | "OVER_QUERY_LIMIT" | "REQUEST_DENIED" | "UNKNOWN_ERROR";
}
