import type { Metadata } from "next";
import { projects } from "@/data/mock";
import { PortfolioFilter } from "./portfolio-filter";

export const metadata: Metadata = {
  title: "Danh mục dự án",
  description:
    "Tổng hợp các dự án thiết kế, bản vẽ kỹ thuật và mô hình 3D.",
};

export default function PortfolioPage() {
  return (
    <section className="grid-container py-16">
      <div className="mb-10">
        <h1>Danh mục dự án</h1>
        <p className="mt-2 text-ink-muted max-w-xl">
          Tổng hợp các dự án thiết kế, bản vẽ kỹ thuật và mô hình 3D.
        </p>
      </div>
      <PortfolioFilter projects={projects} />
    </section>
  );
}
