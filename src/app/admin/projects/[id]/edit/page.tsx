import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditProjectPage({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl mb-6">Sửa dự án</h1>
      <ProjectForm
        mode="edit"
        initialData={{
          id: project.id,
          slug: project.slug,
          title: project.title,
          description: project.description,
          category: project.category,
          thumbnail: project.thumbnail || "",
          imageAlt: project.imageAlt || "",
          imageWidth: project.imageWidth || 0,
          imageHeight: project.imageHeight || 0,
          year: project.year,
          tags: JSON.parse(project.tags),
          pdfUrl: project.pdfUrl || "",
          modelUrl: project.modelUrl || "",
          published: project.published,
        }}
      />
    </div>
  );
}
