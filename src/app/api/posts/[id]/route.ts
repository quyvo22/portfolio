import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

// GET /api/posts/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...post,
    tags: JSON.parse(post.tags),
    date: post.date.toISOString().split("T")[0],
  });
}

// PUT /api/posts/[id] — update (admin only)
export async function PUT(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, excerpt, content, date, readingTime, tags, published } = body;

  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      ...(slug !== undefined && { slug }),
      ...(title !== undefined && { title }),
      ...(excerpt !== undefined && { excerpt }),
      ...(content !== undefined && { content }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(readingTime !== undefined && { readingTime }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(published !== undefined && { published }),
    },
  });

  return NextResponse.json({
    ...post,
    tags: JSON.parse(post.tags),
    date: post.date.toISOString().split("T")[0],
  });
}

// DELETE /api/posts/[id] — delete (admin only)
export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
