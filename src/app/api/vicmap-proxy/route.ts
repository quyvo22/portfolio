import { NextRequest, NextResponse } from "next/server";

const VICMAP_WFS_URL =
  process.env.VICMAP_WFS_URL ||
  "https://opendata.maps.vic.gov.au/geoserver/wfs";

/** Map short names to workspace-prefixed layer names */
const LAYER_MAP: Record<string, string> = {
  V_PARCEL_MP: "open-data-platform:v_parcel_mp",
  CAD_AREA_BDY: "open-data-platform:cad_area_bdy",
};

export async function GET(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_ENABLE_VICMAP === "false") {
    return NextResponse.json({ error: "Vicmap disabled" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const rawTypeName = searchParams.get("typeName") || "V_PARCEL_MP";
  const typeName = LAYER_MAP[rawTypeName] || rawTypeName;
  const bbox = searchParams.get("bbox");
  const srsName = searchParams.get("srsName") || "EPSG:4326";
  const outputFormat = searchParams.get("outputFormat") || "application/json";

  if (!bbox) {
    return NextResponse.json({ error: "Missing bbox parameter" }, { status: 400 });
  }

  const parts = bbox.split(",").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json({ error: "Invalid bbox format" }, { status: 400 });
  }

  // Limit bbox size to prevent abuse (~1 km max)
  const [minLon, minLat, maxLon, maxLat] = parts;
  if (Math.abs(maxLon - minLon) > 0.01 || Math.abs(maxLat - minLat) > 0.01) {
    return NextResponse.json({ error: "BBOX too large (max ~1km)" }, { status: 400 });
  }

  // WFS 1.0.0 uses lon,lat order — avoids axis-order ambiguity
  const wfsParams = new URLSearchParams({
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName,
    outputFormat,
    srsName,
    bbox: `${minLon},${minLat},${maxLon},${maxLat}`,
    maxFeatures: "50",
  });

  try {
    const res = await fetch(`${VICMAP_WFS_URL}?${wfsParams}`, {
      headers: { "User-Agent": "PortfolioApp/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `WFS returned ${res.status}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (err) {
    console.error("[vicmap-proxy] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "WFS fetch failed" },
      { status: 500 },
    );
  }
}
