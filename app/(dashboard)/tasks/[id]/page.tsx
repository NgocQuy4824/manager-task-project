import { TaskDetailContent } from "@/features/tasks/components/task-detail"

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return <TaskDetailContent taskId={params.id} />
}
