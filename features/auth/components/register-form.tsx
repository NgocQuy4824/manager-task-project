"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import {
  registerSchema,
  type RegisterInput,
} from "@/lib/validations/auth"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

export function RegisterForm() {
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  })

  async function onSubmit(values: RegisterInput) {
    setServerError(null)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setServerError(data.message ?? "Đăng ký thất bại")
      return
    }

    router.push("/login?registered=1")
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Error */}
        {serverError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Đăng ký thất bại
              </p>

              <p className="mt-0.5 text-xs text-red-700">
                {serverError}
              </p>
            </div>
          </div>
        )}

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700">
                Họ và tên
              </FormLabel>

              <FormControl>
                <div className="group relative">
                  <UserRound
                    className="
                      pointer-events-none
                      absolute
                      left-3.5
                      top-1/2
                      z-10
                      h-[18px]
                      w-[18px]
                      -translate-y-1/2
                      text-slate-400
                      transition-colors
                      group-focus-within:text-blue-600
                    "
                  />

                  <Input
                    {...field}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className="
                      h-12
                      rounded-xl
                      border-slate-200
                      bg-slate-50/80
                      pl-11
                      pr-4
                      text-sm
                      text-slate-900
                      shadow-sm
                      transition-all
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </FormControl>

              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700">
                Email
              </FormLabel>

              <FormControl>
                <div className="group relative">
                  <Mail
                    className="
                      pointer-events-none
                      absolute
                      left-3.5
                      top-1/2
                      z-10
                      h-[18px]
                      w-[18px]
                      -translate-y-1/2
                      text-slate-400
                      transition-colors
                      group-focus-within:text-blue-600
                    "
                  />

                  <Input
                    {...field}
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    className="
                      h-12
                      rounded-xl
                      border-slate-200
                      bg-slate-50/80
                      pl-11
                      pr-4
                      text-sm
                      text-slate-900
                      shadow-sm
                      transition-all
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </FormControl>

              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Password */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold text-slate-700">
                Mật khẩu
              </FormLabel>

              <FormControl>
                <div className="group relative">
                  <LockKeyhole
                    className="
                      pointer-events-none
                      absolute
                      left-3.5
                      top-1/2
                      z-10
                      h-[18px]
                      w-[18px]
                      -translate-y-1/2
                      text-slate-400
                      transition-colors
                      group-focus-within:text-blue-600
                    "
                  />

                  <Input
                    {...field}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tạo mật khẩu"
                    disabled={isSubmitting}
                    className="
                      h-12
                      rounded-xl
                      border-slate-200
                      bg-slate-50/80
                      pl-11
                      pr-12
                      text-sm
                      text-slate-900
                      shadow-sm
                      transition-all
                      placeholder:text-slate-400
                      hover:border-slate-300
                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />

                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    disabled={isSubmitting}
                    className="
                      absolute
                      right-3.5
                      top-1/2
                      -translate-y-1/2
                      rounded-md
                      p-1
                      text-slate-400
                      transition-colors
                      hover:bg-slate-100
                      hover:text-slate-600
                      disabled:pointer-events-none
                    "
                    aria-label={
                      showPassword
                        ? "Ẩn mật khẩu"
                        : "Hiện mật khẩu"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </FormControl>

              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Register button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          size="lg"
          className="
            group
            mt-2
            h-12
            w-full
            rounded-xl
            bg-blue-600
            text-sm
            font-semibold
            text-white
            shadow-lg
            shadow-blue-600/20
            transition-all
            duration-200
            hover:bg-blue-700
            hover:shadow-xl
            hover:shadow-blue-600/25
            active:scale-[0.99]
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tạo tài khoản...
            </>
          ) : (
            <>
              Tạo tài khoản

              <ArrowRight
                className="
                  ml-2
                  h-4
                  w-4
                  transition-transform
                  duration-200
                  group-hover:translate-x-1
                "
              />
            </>
          )}
        </Button>

        {/* Login */}
        <div className="pt-1 text-center">
          <p className="text-sm text-slate-500">
            Đã có tài khoản?{" "}
            <Link
              href="/login"
              className="
                font-semibold
                text-blue-600
                transition-colors
                hover:text-blue-700
                hover:underline
                hover:underline-offset-4
              "
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </Form>
  )
}