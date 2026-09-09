import { ProjectDetailContent } from "@/features/projects/components/project-detail"

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return <ProjectDetailContent projectId={params.id} />
}
