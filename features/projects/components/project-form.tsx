"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, Loader2, Sparkles, Type } from "lucide-react"
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-primary/10 text-primary">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <div>
            <CardTitle className="text-lg">{isEdit ? "Cập nhật project" : "Tạo project"}</CardTitle>
            <CardDescription>{isEdit ? "Cập nhật tên và mô tả cho project." : "Tạo không gian mới để giao việc và cộng tác."}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {serverError && (
          <p className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
            {serverError}
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" /> Tên project
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Website bán hàng" {...field} />
                  </FormControl>
                  <FormDescription>Tên ngắn gọn, dễ nhận diện trong danh sách.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Mô tả
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Mô tả ngắn về mục tiêu, phạm vi của project..." rows={4} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>Tùy chọn — để trống nếu chưa cần.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={pending}>
                Hủy
              </Button>
              <Button type="submit" disabled={pending} className="gap-1.5 shadow-soft">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? "..." : isEdit ? "Lưu thay đổi" : "Tạo project"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
