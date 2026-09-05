export default function TaskDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Task {params.id}</h1>
      <p className="text-sm text-muted-foreground">Chi tiết task — skeleton.</p>
    </div>
  )
}
