import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl mb-6">Tạo dự án mới</h1>
      <ProjectForm mode="create" />
    </div>
  );
}
