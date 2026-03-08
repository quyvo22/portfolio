import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/map-scenes — list published scenes (or all for admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";

  const scenes = await prisma.mapScene.findMany({
    where: isAdmin ? {} : { published: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(scenes);
}

// POST /api/map-scenes — create a new scene (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, models, centerLng, centerLat, zoom, pitch, bearing, published } = body;

  if (!name) {
    return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
  }

  const scene = await prisma.mapScene.create({
    data: {
      name,
      description: description || "",
      models: typeof models === "string" ? models : JSON.stringify(models || []),
      centerLng: centerLng ?? 108.2208,
      centerLat: centerLat ?? 16.0678,
      zoom: zoom ?? 18,
      pitch: pitch ?? 60,
      bearing: bearing ?? 0,
      published: published ?? false,
      authorId: session.user.id,
    },
  });

  return NextResponse.json(scene, { status: 201 });
}
