import type { Metadata } from "next";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { getProjectBySlug } from "@/lib/data";
import { ArrowLeft, FileText, Box } from "lucide-react";
import { notFound } from "next/navigation";

import { validateModelUrl } from "@/lib/validate-model-url";
import { ProjectTabs } from "@/components/project/ProjectTabs";

const PdfViewer = dynamicImport(
  () => import("@/components/ui/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false }
);

const ModelViewer = dynamicImport(
  () => import("@/components/3d/model-viewer").then((m) => m.ModelViewer),
  { ssr: false }
);

const GLBViewer = dynamicImport(
  () => import("@/components/viewer/GLBViewer").then((m) => m.GLBViewer),
  { ssr: false }
);

interface Props {
  params: { slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Không tìm thấy dự án" };
  return { title: project.title, description: project.description };
}

export default async function ProjectPage({ params }: Props) {
  const slug = decodeURIComponent(params.slug);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const showPdf = project.category === "pdf" || project.category === "both";
  const show3d = project.category === "3d" || project.category === "both";
  const hasModel = validateModelUrl(project.modelUrl).valid;

  return (
    <section className="grid-container py-12">
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Quay lại danh mục
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-surface-overlay rounded-md text-xs font-medium text-ink-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1>{project.title}</h1>
        <p className="mt-3 text-ink-muted text-lg max-w-2xl">
          {project.description}
        </p>
        <p className="mt-2 text-sm text-ink-faint">Năm: {project.year}</p>
      </div>

      {/* Tab Navigation */}
      <ProjectTabs
        slug={slug}
        modelUrl={project.modelUrl}
        projectTitle={project.title}
      />

      {/* Viewer placeholders */}
      <div className="grid-12">
        {showPdf && (
          <div
            className={
              show3d
                ? "col-span-4 sm:col-span-8 lg:col-span-7"
                : "col-span-4 sm:col-span-8 lg:col-span-12"
            }
          >
            {project.pdfUrl ? (
              <PdfViewer url={project.pdfUrl} />
            ) : (
              <div className="card">
                <div className="aspect-[3/4] bg-surface-overlay flex flex-col items-center justify-center gap-3 text-ink-faint">
                  <FileText size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">Chưa có file PDF</p>
                </div>
              </div>
            )}
          </div>
        )}
        {show3d && (
          <div
            className={
              showPdf
                ? "col-span-4 sm:col-span-8 lg:col-span-5"
                : "col-span-4 sm:col-span-8 lg:col-span-12"
            }
          >
            {validateModelUrl(project.modelUrl).valid ? (
              <>
                <ModelViewer
                  url={project.modelUrl!}
                  poster={project.thumbnail}
                />
                <GLBViewer url={project.modelUrl!} />
              </>
            ) : (
              <div className="card">
                <div className="aspect-square bg-surface-overlay flex flex-col items-center justify-center gap-3 text-ink-faint">
                  <Box size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">Chưa có model 3D</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="mt-12 grid-12">
        <div className="col-span-4 sm:col-span-8 lg:col-span-8">
          <h2 className="text-xl mb-4">Chi tiết dự án</h2>
          <div className="space-y-4 text-ink-muted leading-relaxed">
            <p>
              Đây là trang chi tiết dự án mẫu. Trong các phase sau, nội dung
              sẽ được lấy từ cơ sở dữ liệu, bao gồm mô tả chi tiết, thông số
              kỹ thuật, hình ảnh bổ sung và các file đính kèm.
            </p>
            <p>
              Trình xem PDF sẽ hỗ trợ thumbnails, tìm kiếm text, phím tắt
              điều hướng. Trình xem 3D sẽ hỗ trợ Draco/Meshopt/KTX2, chuyển
              đổi material và preset hiển thị.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
