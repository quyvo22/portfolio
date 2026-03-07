"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import dynamic from "next/dynamic";

const MapViewer = dynamic(
  () => import("@/components/MapViewer").then((m) => m.MapViewer),
  { ssr: false },
);

const DEFAULT_MODEL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoxAnimated/glTF-Binary/BoxAnimated.glb";

export default function GlbOnMapPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <MapViewer modelUrl={DEFAULT_MODEL} />
    </div>
  );
}
