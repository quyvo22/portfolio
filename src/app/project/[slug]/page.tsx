import type { Metadata } from "next";
import Link from "next/link";
import { getProjectBySlug } from "@/lib/data";
import { ArrowLeft, FileText, Box } from "lucide-react";
import { notFound } from "next/navigation";

interface Props {
  params: { slug: string };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3099";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: "Không tìm thấy dự án" };

  const canonical = `${SITE_URL}/project/${project.slug}`;
  const ogImage = project.thumbnail || `${SITE_URL}/og-placeholder.svg`;

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: project.title,
      description: project.description,
      url: canonical,
      images: [
        {
          url: ogImage,
          width: project.imageWidth || 1200,
          height: project.imageHeight || 630,
          alt: project.imageAlt || project.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      images: [ogImage],
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const canonical = `${SITE_URL}/project/${project.slug}`;
  const ogImage = project.thumbnail || `${SITE_URL}/og-placeholder.svg`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description,
    url: canonical,
    dateCreated: String(project.year),
    dateModified: project.updatedAt
      ? new Date(project.updatedAt).toISOString()
      : undefined,
    creator: {
      "@type": "Organization",
      name: "Portfolio Studio",
      url: SITE_URL,
    },
    image: {
      "@type": "ImageObject",
      url: ogImage,
      width: project.imageWidth || 1200,
      height: project.imageHeight || 630,
    },
    keywords: project.tags.join(", "),
    genre: project.category,
  };

  const showPdf = project.category === "pdf" || project.category === "both";
  const show3d = project.category === "3d" || project.category === "both";

  return (
    <section className="grid-container py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Quay lại danh mục
      </Link>

      {/* Header */}
      <div className="mb-10">
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
            <div className="card">
              <div className="aspect-[3/4] bg-surface-overlay flex flex-col items-center justify-center gap-3 text-ink-faint">
                <FileText size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Trình xem PDF</p>
                <p className="text-xs">(Phase 5: PDF.js viewer)</p>
              </div>
            </div>
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
            <div className="card">
              <div className="aspect-square bg-surface-overlay flex flex-col items-center justify-center gap-3 text-ink-faint">
                <Box size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Trình xem 3D</p>
                <p className="text-xs">(Phase 6: React Three Fiber)</p>
              </div>
            </div>
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
