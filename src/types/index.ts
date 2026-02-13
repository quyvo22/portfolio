// ============================================================
// Shared type definitions
// Extracted from mock data — will be aligned with Prisma schema
// ============================================================

export interface Project {
  slug: string;
  title: string;
  description: string;
  category: "pdf" | "3d" | "both";
  thumbnail: string;
  year: number;
  tags: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: string[];
}
