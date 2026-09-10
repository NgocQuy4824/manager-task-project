"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ShieldCheck, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import {
  createUserSchema,
  updateUserSchema,
} from "@/features/users/schemas"

import {
  useCreateUser,
  useUpdateUser,
} from "@/features/users/hooks/use-users"

import type { UserListItem } from "@/features/users/types"

const roleSchema = z.enum([
  "ADMIN",
  "MANAGER",
  "MEMBER",
])

const formSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().optional(),
  name: z.string().max(100).optional(),
  role: roleSchema,
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
  open: boolean
  onOpenChange: (value: boolean) => void
  editing?: UserListItem | null
}

export function UserDialog({
  open,
  onOpenChange,
  editing,
}: Props) {
  const createMut = useCreateUser()
  const updateMut = useUpdateUser()

  const [err, setErr] = useState<string | null>(null)

  const isEdit = !!editing

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "MEMBER",
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) return

    setErr(null)

    form.reset({
      email: editing?.email ?? "",
      password: "",
      name: editing?.name ?? "",
      role:
        (editing?.role as FormValues["role"]) ??
        "MEMBER",
      isActive:
        editing?.isActive ?? true,
    })
  }, [open, editing, form])

  async function onSubmit(values: FormValues) {
    setErr(null)

    try {
      if (isEdit && editing) {
        await updateMut.mutateAsync({
          id: editing.id,
          email: values.email,
          name: values.name,
          role: values.role,
          isActive: values.isActive,
          ...(values.password
            ? { password: values.password }
            : {}),
        })
      } else {
        if (!values.password) {
          form.setError("password", {
            message: "Vui lòng nhập mật khẩu",
          })

          return
        }

        await createMut.mutateAsync({
          email: values.email,
          password: values.password,
          name: values.name,
          role: values.role,
          isActive: values.isActive,
        })
      }

      onOpenChange(false)
    } catch (e: unknown) {
      const error = e as {
        error?: unknown
        message?: string
      }

      setErr(
        typeof error.error === "string"
          ? error.error
          : error.message ??
              "Có lỗi xảy ra"
      )
    }
  }

  const pending =
    createMut.isPending ||
    updateMut.isPending

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {isEdit ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <UserPlus className="h-6 w-6" />
            )}
          </div>

          <DialogTitle>
            {isEdit
              ? "Chỉnh sửa người dùng"
              : "Thêm người dùng"}
          </DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin, vai trò và trạng thái tài khoản."
              : "Tạo tài khoản người dùng mới trong hệ thống."}
          </DialogDescription>
        </DialogHeader>

        {err && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {err}
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mật khẩu{" "}
                    {isEdit && (
                      <span className="font-normal text-muted-foreground">
                        (để trống nếu không đổi)
                      </span>
                    )}
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEdit
                          ? "Mật khẩu mới"
                          : "Tối thiểu 6 ký tự"
                      }
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ và tên</FormLabel>

                  <FormControl>
                    <Input
                      placeholder="Nguyễn Văn A"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vai trò</FormLabel>

                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="ADMIN">
                          Quản trị viên
                        </SelectItem>

                        <SelectItem value="MANAGER">
                          Quản lý
                        </SelectItem>

                        <SelectItem value="MEMBER">
                          Thành viên
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>

                    <Select
                      value={
                        field.value
                          ? "ACTIVE"
                          : "INACTIVE"
                      }
                      onValueChange={(value) =>
                        field.onChange(
                          value === "ACTIVE"
                        )
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          Hoạt động
                        </SelectItem>

                        <SelectItem value="INACTIVE">
                          Vô hiệu hóa
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onOpenChange(false)
                }
              >
                Hủy
              </Button>

              <Button
                type="submit"
                disabled={pending}
                className="min-w-[100px]"
              >
                {pending
                  ? "Đang lưu..."
                  : isEdit
                    ? "Lưu thay đổi"
                    : "Tạo người dùng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}