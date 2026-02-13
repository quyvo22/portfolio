import { PostForm } from "@/components/admin/post-form";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl mb-6">Tạo bài viết mới</h1>
      <PostForm mode="create" />
    </div>
  );
}
