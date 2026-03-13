/**
 * Client-side Vicmap WFS fetcher — calls /api/vicmap-proxy.
 * Tries V_PARCEL_MP (polygons) first, falls back to CAD_AREA_BDY (lines).
 */

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

export async function fetchVicmapParcelsByBBOX(
  bbox: [number, number, number, number],
  typeName = "V_PARCEL_MP",
): Promise<GeoJSON.FeatureCollection> {
  const params = new URLSearchParams({
    typeName,
    bbox: bbox.join(","),
    srsName: "EPSG:4326",
    outputFormat: "application/json",
  });

  try {
    const res = await fetch(`/api/vicmap-proxy?${params}`);
    if (!res.ok) {
      if (typeName === "V_PARCEL_MP") {
        return fetchVicmapParcelsByBBOX(bbox, "CAD_AREA_BDY");
      }
      return EMPTY_FC;
    }

    const data: GeoJSON.FeatureCollection = await res.json();

    if (typeName === "V_PARCEL_MP" && (!data.features || data.features.length === 0)) {
      return fetchVicmapParcelsByBBOX(bbox, "CAD_AREA_BDY");
    }

    return data;
  } catch {
    return EMPTY_FC;
  }
}

/** Bbox +-offset around a point (default ~55m). */
export function bboxAroundPoint(
  lon: number,
  lat: number,
  offset = 0.0005,
): [number, number, number, number] {
  return [lon - offset, lat - offset, lon + offset, lat + offset];
}

/** Simple centroid: average of all coordinates in a feature. */
export function computeCentroid(feature: GeoJSON.Feature): [number, number] {
  const coords: number[][] = [];

  function extract(geom: GeoJSON.Geometry) {
    switch (geom.type) {
      case "Point":
        coords.push(geom.coordinates as number[]);
        break;
      case "LineString":
      case "MultiPoint":
        (geom.coordinates as number[][]).forEach((c) => coords.push(c));
        break;
      case "Polygon":
      case "MultiLineString":
        (geom.coordinates as number[][][]).forEach((ring) =>
          ring.forEach((c) => coords.push(c)),
        );
        break;
      case "MultiPolygon":
        (geom.coordinates as number[][][][]).forEach((poly) =>
          poly.forEach((ring) => ring.forEach((c) => coords.push(c))),
        );
        break;
      case "GeometryCollection":
        geom.geometries.forEach(extract);
        break;
    }
  }

  if (feature.geometry) extract(feature.geometry);
  if (coords.length === 0) return [0, 0];

  const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
  return [sum[0] / coords.length, sum[1] / coords.length];
}
