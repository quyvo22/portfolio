import Link from "next/link";
import { Map, Box, Eye } from "lucide-react";
import { getPublishedMapScenes } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MapsPage() {
  const scenes = await getPublishedMapScenes();

  return (
    <section className="grid-container py-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Map size={28} className="text-accent-500" />
          <h1 className="font-serif text-3xl font-bold">Maps & 3D</h1>
        </div>
        <p className="text-ink-muted mb-10">
          Khám phá bản đồ tương tác với mô hình 3D GLB. Đặt, xoay và điều
          chỉnh mô hình trực tiếp trên bản đồ.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* GLB on Map — sandbox editor */}
          <Link
            href="/maps/glb-on-map"
            className="group flex flex-col gap-3 p-6 rounded-xl border border-border bg-surface hover:border-accent-400 hover:shadow-lg transition-all duration-200"
          >
            <Box size={24} className="text-accent-500 group-hover:scale-110 transition-transform" />
            <h2 className="font-serif text-lg font-semibold">GLB on Map</h2>
            <p className="text-sm text-ink-muted">
              Tải mô hình GLB 3D lên bản đồ MapTiler. Hỗ trợ multi-model, place
              mode và transform controls.
            </p>
          </Link>

          {/* Saved scenes from DB */}
          {scenes.map((scene) => {
            const modelCount = (() => {
              try {
                return JSON.parse(scene.models).length;
              } catch {
                return 0;
              }
            })();

            return (
              <Link
                key={scene.id}
                href={`/maps/scenes/${scene.id}`}
                className="group flex flex-col gap-3 p-6 rounded-xl border border-border bg-surface hover:border-accent-400 hover:shadow-lg transition-all duration-200"
              >
                <Eye size={24} className="text-accent-500 group-hover:scale-110 transition-transform" />
                <h2 className="font-serif text-lg font-semibold">{scene.name}</h2>
                {scene.description && (
                  <p className="text-sm text-ink-muted">{scene.description}</p>
                )}
                <p className="text-xs text-ink-faint">
                  {modelCount} model{modelCount !== 1 ? "s" : ""}
                </p>
              </Link>
            );
          })}
        </div>

        {scenes.length === 0 && (
          <p className="text-sm text-ink-faint mt-6">
            Chưa có scene nào được lưu. Vào GLB on Map để tạo và lưu scene.
          </p>
        )}
      </div>
    </section>
  );
}
