import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

// GET /api/projects/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ...project, tags: JSON.parse(project.tags) });
}

// PUT /api/projects/[id] — update (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, description, category, thumbnail, year, tags, pdfUrl, modelUrl, published } = body;

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(thumbnail !== undefined && { thumbnail }),
      ...(year !== undefined && { year }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(pdfUrl !== undefined && { pdfUrl }),
      ...(modelUrl !== undefined && { modelUrl }),
      ...(published !== undefined && { published }),
    },
  });

  return NextResponse.json({ ...project, tags: JSON.parse(project.tags) });
}

// DELETE /api/projects/[id] — delete (admin only)
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
