export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Project {params.id}</h1>
      <p className="text-sm text-muted-foreground">Chi tiết project — skeleton.</p>
    </div>
  )
}
