import type { Metadata } from "next";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { getMapSceneById } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

const MapViewer = dynamicImport(
  () => import("@/components/MapViewer").then((m) => m.MapViewer),
  { ssr: false }
);

interface Props {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scene = await getMapSceneById(params.id);
  if (!scene) return { title: "Scene not found" };
  return { title: `${scene.name} — Maps`, description: scene.description };
}

export default async function SceneDetailPage({ params }: Props) {
  const scene = await getMapSceneById(params.id);
  if (!scene) notFound();

  return (
    <section className="flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      <div className="grid-container py-3 flex items-center gap-3">
        <Link
          href="/maps"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} /> Maps
        </Link>
        <span className="text-ink-faint">·</span>
        <h1 className="text-lg font-semibold truncate">{scene.name}</h1>
      </div>
      <div className="flex-1 min-h-0">
        <MapViewer sceneId={scene.id} editable={true} />
      </div>
    </section>
  );
}
