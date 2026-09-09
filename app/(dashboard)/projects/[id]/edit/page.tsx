import { ProjectForm } from "@/features/projects/components/project-form"

export default function EditProjectPage({ params }: { params: { id: string } }) {
  return <ProjectForm projectId={params.id} />
}
