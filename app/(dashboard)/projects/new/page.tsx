import { ProjectForm } from "@/features/projects/components/project-form"

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Tạo project</h1>
      <ProjectForm />
    </div>
  )
}
