"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useCreateUser, useUpdateUser } from "@/features/users/hooks/use-users"
import type { UserListItem } from "@/features/users/types"

const createSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Tối thiểu 6 ký tự").max(100),
  name: z.string().max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
})
const editSchema = z.object({
  name: z.string().max(100).optional(),
  role: z.enum(["ADMIN", "MANAGER", "MEMBER"]),
  email: z.string().email().optional(),
})

export function UserDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing?: UserListItem | null }) {
  const createMut = useCreateUser()
  const updateMut = useUpdateUser()
  const [err, setErr] = useState<string | null>(null)
  const isEdit = !!editing

  const form = useForm<z.infer<typeof createSchema> | z.infer<typeof editSchema>>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: isEdit ? { name: editing?.name ?? "", role: (editing?.role as never) ?? "MEMBER", email: editing?.email ?? "" } : { email: "", password: "", name: "", role: "MEMBER" },
  })

  useEffect(() => {
    if (open) {
      setErr(null)
      form.reset(
        isEdit
          ? { name: editing?.name ?? "", role: (editing?.role as never) ?? "MEMBER", email: editing?.email ?? "" }
          : { email: "", password: "", name: "", role: "MEMBER" }
      )
    }
  }, [open, editing, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: Record<string, string>) {
    setErr(null)
    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({ id: editing.id, name: values.name || undefined, role: values.role, email: values.email || undefined })
      } else {
        await createMut.mutateAsync({ email: values.email, password: values.password, name: values.name || undefined, role: values.role })
      }
      onOpenChange(false)
    } catch (e: unknown) {
      const msg = (e as { error?: unknown })?.error ? JSON.stringify((e as { error: unknown }).error) : (e as Error)?.message ?? "Lỗi"
      setErr(msg)
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật user" : "Tạo user mới"}</DialogTitle>
        </DialogHeader>
        {err && <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">{err}</p>}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as never)} className="space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {!isEdit && (
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>Mật khẩu</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            )}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Tên</FormLabel><FormControl><Input placeholder="Nguyễn Văn A" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Vai trò</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="ADMIN">Quản trị</SelectItem>
                    <SelectItem value="MANAGER">Quản lý</SelectItem>
                    <SelectItem value="MEMBER">Thành viên</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={pending}>{pending ? "..." : isEdit ? "Lưu" : "Tạo"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
