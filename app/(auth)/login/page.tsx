import { Suspense } from "react"
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  LockKeyhole,
  ShieldCheck,
  Users,
} from "lucide-react"

import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/auth-bg.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-slate-950/65" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/50 to-blue-950/70" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10 lg:px-10">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_430px]">

          {/* ================= LEFT ================= */}
          <section className="hidden lg:block">
            <div className="max-w-2xl">

              {/* Logo */}
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
                  <ClipboardCheck className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h1 className="text-xl font-bold tracking-tight text-white">
                    Task Manager
                  </h1>

                  <p className="text-sm text-white/60">
                    Quản lý công việc hiệu quả
                  </p>
                </div>
              </div>

              {/* Heading */}
              <h2 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-white xl:text-6xl">
                Quản lý công việc.
                <br />
                <span className="text-blue-400">
                  Làm việc thông minh hơn.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
                Quản lý dự án, phân công nhiệm vụ và theo dõi tiến độ
                của đội nhóm trên một nền tảng duy nhất.
              </p>

              {/* Features */}
              <div className="mt-9 flex flex-wrap gap-3">
                <Feature
                  icon={<CheckCircle2 />}
                  text="Theo dõi tiến độ"
                />

                <Feature
                  icon={<Users />}
                  text="Làm việc nhóm"
                />

                <Feature
                  icon={<ShieldCheck />}
                  text="Phân quyền bảo mật"
                />
              </div>
            </div>
          </section>

          {/* ================= LOGIN CARD ================= */}
          <section className="w-full">
            <div className="rounded-3xl border border-white/20 bg-white/95 p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">

              {/* Mobile logo */}
              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <ClipboardCheck className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Task Manager
                  </h1>

                  <p className="text-xs text-slate-500">
                    Quản lý công việc hiệu quả
                  </p>
                </div>
              </div>

              {/* Header */}
              <div className="mb-8">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <LockKeyhole className="h-5 w-5" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Chào mừng trở lại
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Đăng nhập để tiếp tục quản lý công việc của bạn.
                </p>
              </div>

              {/* Form */}
              <Suspense
                fallback={
                  <div className="py-8 text-center text-sm text-slate-500">
                    Đang tải...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>

              {/* Footer */}
              <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Thông tin của bạn được bảo mật</span>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/50">
              Hệ thống quản lý công việc nội bộ
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

function Feature({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white/80 backdrop-blur-md">
      <span className="text-blue-400 [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>

      {text}
    </div>
  )
}