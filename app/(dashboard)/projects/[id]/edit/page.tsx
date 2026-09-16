import { redirect } from "next/navigation"

export default function EditProjectPage({ params }: { params: { id: string } }) {
  redirect(`/projects/${params.id}`)
}
