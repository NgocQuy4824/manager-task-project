import { ProjectForm } from "@/features/projects/components/project-form"

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Cập nhật project</h1>
      <ProjectForm projectId={params.id} />
    </div>
  )
}
