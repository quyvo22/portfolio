import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/posts — list all published posts
export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });

  const result = posts.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags),
    date: p.date.toISOString().split("T")[0],
  }));

  return NextResponse.json(result);
}

// POST /api/posts — create a new post (admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, title, excerpt, content, date, readingTime, tags, imageUrl, imageAlt, imageWidth, imageHeight, published } = body;

  if (!slug || !title || !excerpt) {
    return NextResponse.json({ error: "Missing required fields: slug, title, excerpt" }, { status: 400 });
  }

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt,
      content: content || "",
      date: date ? new Date(date) : new Date(),
      readingTime: readingTime || "5 phút",
      tags: JSON.stringify(tags || []),
      imageUrl: imageUrl || null,
      imageAlt: imageAlt || null,
      imageWidth: imageWidth || null,
      imageHeight: imageHeight || null,
      published: published ?? false,
      authorId: session.user.id,
    },
  });

  return NextResponse.json(
    { ...post, tags: JSON.parse(post.tags), date: post.date.toISOString().split("T")[0] },
    { status: 201 }
  );
}
