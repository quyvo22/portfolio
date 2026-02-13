import { prisma } from "@/lib/prisma";
import type { Project as PrismaProject, BlogPost as PrismaBlogPost } from "@prisma/client";

// Parse tags JSON string to array
function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

// Transform Prisma project to include parsed tags
function transformProject(project: PrismaProject) {
  return {
    ...project,
    tags: parseTags(project.tags),
  };
}

// Transform Prisma blog post to include parsed tags
function transformPost(post: PrismaBlogPost) {
  return {
    ...post,
    tags: parseTags(post.tags),
    date: post.date.toISOString().split("T")[0],
  };
}

// ── Projects ──────────────────────────────────────────────

export async function getPublishedProjects() {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: { year: "desc" },
  });
  return projects.map(transformProject);
}

export async function getProjectBySlug(slug: string) {
  const project = await prisma.project.findUnique({
    where: { slug },
  });
  if (!project) return null;
  return transformProject(project);
}

export async function getAllProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
  });
  return projects.map(transformProject);
}

// ── Blog Posts ─────────────────────────────────────────────

export async function getPublishedPosts() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { date: "desc" },
  });
  return posts.map(transformPost);
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });
  if (!post) return null;
  return transformPost(post);
}

export async function getAllPosts() {
  const posts = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });
  return posts.map(transformPost);
}
