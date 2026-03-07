import Link from "next/link";
import { Map, Box } from "lucide-react";

export default function MapsPage() {
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
        </div>
      </div>
    </section>
  );
}
