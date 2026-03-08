import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

// GET /api/map-scenes/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  const scene = await prisma.mapScene.findUnique({
    where: { id: params.id },
  });

  if (!scene) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(scene);
}

// PUT /api/map-scenes/[id] — update (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, models, centerLng, centerLat, zoom, pitch, bearing, published } = body;

  const scene = await prisma.mapScene.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(models !== undefined && { models: typeof models === "string" ? models : JSON.stringify(models) }),
      ...(centerLng !== undefined && { centerLng }),
      ...(centerLat !== undefined && { centerLat }),
      ...(zoom !== undefined && { zoom }),
      ...(pitch !== undefined && { pitch }),
      ...(bearing !== undefined && { bearing }),
      ...(published !== undefined && { published }),
    },
  });

  return NextResponse.json(scene);
}

// DELETE /api/map-scenes/[id] — delete (admin only)
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.mapScene.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
