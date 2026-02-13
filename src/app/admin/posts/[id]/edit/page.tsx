import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/admin/post-form";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
  });

  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl mb-6">Sửa bài viết</h1>
      <PostForm
        mode="edit"
        initialData={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          date: post.date.toISOString().split("T")[0],
          readingTime: post.readingTime,
          tags: JSON.parse(post.tags),
          published: post.published,
        }}
      />
    </div>
  );
}
