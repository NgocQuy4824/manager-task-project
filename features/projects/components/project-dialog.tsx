"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { FileText, FolderKanban, Loader2, Type } from "lucide-react"
import { createProjectSchema, type CreateProjectInput } from "@/lib/validations/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateProject, useProject, useUpdateProject } from "@/features/projects/hooks/use-projects"

export function ProjectDialog({ open, onOpenChange, projectId }: { open: boolean; onOpenChange: (v: boolean) => void; projectId?: string | null }) {
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
    if (!open) return
    setServerError(null)
    if (isEdit && data?.data) form.reset({ name: data.data.name, description: data.data.description ?? "" })
    else form.reset({ name: "", description: "" })
  }, [open, isEdit, data]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: CreateProjectInput) {
    setServerError(null)
    try {
      if (isEdit) await updateMut.mutateAsync({ id: projectId!, name: values.name, description: values.description })
      else await createMut.mutateAsync({ name: values.name, description: values.description })
      onOpenChange(false)
    } catch (e: unknown) {
      setServerError((e as { error?: string })?.error ?? (e as Error)?.message ?? "Lỗi")
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto sm:max-w-lg">
        <DialogHeader className="space-y-0 pb-1">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border bg-primary/10 text-primary">
              <FolderKanban className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg">{isEdit ? "Cập nhật project" : "Tạo project"}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {isEdit ? "Cập nhật tên và mô tả cho project." : "Tạo không gian mới để giao việc và cộng tác."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        {serverError && (
          <p className="mb-1 mt-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{serverError}</p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" /> Tên project <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Website bán hàng" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Tên ngắn gọn, dễ nhận diện trong danh sách.</FormDescription>
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
                    <Textarea placeholder="Mô tả ngắn về mục tiêu, phạm vi của project..." rows={3} className="resize-none text-sm" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription className="text-xs">Tùy chọn — để trống nếu chưa cần.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Hủy</Button>
              <Button type="submit" disabled={pending} className="gap-1.5 shadow-soft">
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Lưu thay đổi" : "Tạo project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
