export default function UserDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">User {params.id}</h1>
      <p className="text-sm text-muted-foreground">Chi tiết user — skeleton.</p>
    </div>
  )
}
