"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Loader2,
} from "lucide-react"

import {
  loginSchema,
  type LoginInput,
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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const callbackUrl = searchParams.get("callbackUrl") ?? "/"

  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: LoginInput) {
    setServerError(null)

    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (res?.error) {
      setServerError("Email hoặc mật khẩu không đúng")
      return
    }

    if (res?.ok) {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const isSubmitting = form.formState.isSubmitting
  const registered = searchParams.get("registered")

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        {/* Success */}
        {registered && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="h-3.5 w-3.5 text-white"
              >
                <path
                  d="M5 10.5L8.2 13.5L15 6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Đăng ký thành công
              </p>

              <p className="mt-0.5 text-xs text-emerald-700">
                Vui lòng đăng nhập để tiếp tục.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {serverError && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />

            <div>
              <p className="text-sm font-semibold text-red-800">
                Đăng nhập thất bại
              </p>

              <p className="mt-0.5 text-xs text-red-700">
                {serverError}
              </p>
            </div>
          </div>
        )}

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
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
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

        {/* Login button */}
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
              Đang đăng nhập...
            </>
          ) : (
            <>
              Đăng nhập

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

        {/* Register */}
        <div className="pt-1 text-center">
          <p className="text-sm text-slate-500">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="
                font-semibold
                text-blue-600
                transition-colors
                hover:text-blue-700
                hover:underline
                hover:underline-offset-4
              "
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </form>
    </Form>
  )
}