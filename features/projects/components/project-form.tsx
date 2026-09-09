"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateProject, useProject, useUpdateProject } from "@/features/projects/hooks/use-projects"

export function ProjectForm({ projectId }: { projectId?: string }) {
  const router = useRouter()
  const isEdit = !!projectId
  const { data } = useProject(projectId ?? "")
  const createMut = useCreateProject()
  const updateMut = useUpdateProject()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "", description: "" },
  })
  
  useEffect(() => {
    if (data?.data) form.reset({ name: data.data.name, description: data.data.description ?? "" })
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: CreateProjectInput) {
    setServerError(null)
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: projectId!, name: values.name, description: values.description })
        router.push(`/projects/${projectId}`)
      } else {
        const res = await createMut.mutateAsync({ name: values.name, description: values.description })
        router.push(`/projects/${res.data.id}`)
      }
    } catch (e: unknown) {
      setServerError((e as { error?: string })?.error ?? (e as Error)?.message ?? "Lỗi")
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Card className="max-w-xl border shadow-soft">
      <CardHeader><CardTitle>{isEdit ? "Cập nhật project" : "Tạo project"}</CardTitle></CardHeader>
      <CardContent>
        {serverError && <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{serverError}</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Tên project</FormLabel><FormControl><Input placeholder="VD: Website bán hàng" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea placeholder="Mô tả ngắn..." {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
              <Button type="submit" disabled={pending}>{pending ? "..." : isEdit ? "Lưu" : "Tạo"}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
