import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/projects — list all published projects
export async function GET() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { year: "desc" },
  });

  const result = projects.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags),
  }));

  return NextResponse.json(result);
}

// POST /api/projects — create a new project (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, description, category, thumbnail, imageAlt, imageWidth, imageHeight, year, tags, pdfUrl, modelUrl, published, mapSceneId } = body;

  if (!slug || !title || !description) {
    return NextResponse.json({ error: "Missing required fields: slug, title, description" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      slug,
      title,
      description,
      category: category || "both",
      thumbnail: thumbnail || null,
      imageAlt: imageAlt || null,
      imageWidth: imageWidth || null,
      imageHeight: imageHeight || null,
      year: year || new Date().getFullYear(),
      tags: JSON.stringify(tags || []),
      pdfUrl: pdfUrl || null,
      modelUrl: modelUrl || null,
      mapSceneId: mapSceneId || null,
      published: published ?? false,
      authorId: session.user.id,
    },
  });

  return NextResponse.json({ ...project, tags: JSON.parse(project.tags) }, { status: 201 });
}
