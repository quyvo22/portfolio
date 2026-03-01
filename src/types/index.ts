// ============================================================
// Shared type definitions — aligned with Prisma schema
// ============================================================

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  year: number;
  tags: string[];
  pdfUrl: string | null;
  modelUrl: string | null;
  published: boolean;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readingTime: string;
  tags: string[];
  published: boolean;
  authorId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
