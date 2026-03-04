import type { Metadata } from "next";
import dynamic from "next/dynamic";

const GlbOnMap = dynamic(
  () => import("@/components/maptiler/GlbOnMap").then((m) => m.GlbOnMap),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "GLB on Map",
  description: "Render a GLB 3D model on a MapTiler map with Three.js overlay.",
};

export default function GlbOnMapPage() {
  return <GlbOnMap />;
}
