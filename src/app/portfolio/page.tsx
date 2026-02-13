import type { Metadata } from "next";
import { getPublishedProjects } from "@/lib/data";
import { PortfolioFilter } from "@/components/ui/portfolio-filter";

export const metadata: Metadata = {
  title: "Danh mục dự án",
  description:
    "Tổng hợp các dự án thiết kế, bản vẽ kỹ thuật và mô hình 3D.",
};

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const projects = await getPublishedProjects();
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
