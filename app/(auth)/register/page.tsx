import {
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react"

import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
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

      {/* Gradient */}
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
                Bắt đầu quản lý.
                <br />
                <span className="text-blue-400">
                  Hoàn thành nhiều hơn.
                </span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-white/70">
                Tạo tài khoản và bắt đầu tổ chức công việc,
                quản lý dự án và phối hợp với đội nhóm hiệu quả hơn.
              </p>

              {/* Features */}
              <div className="mt-9 flex flex-wrap gap-3">
                <Feature
                  icon={<Zap />}
                  text="Làm việc nhanh chóng"
                />

                <Feature
                  icon={<Users />}
                  text="Kết nối đội nhóm"
                />

                <Feature
                  icon={<CheckCircle2 />}
                  text="Hoàn thành mục tiêu"
                />
              </div>
            </div>
          </section>

          {/* ================= REGISTER CARD ================= */}
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
                  <CheckSquare className="h-5 w-5" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Tạo tài khoản
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Đăng ký tài khoản để bắt đầu quản lý công việc.
                </p>
              </div>

              {/* Form */}
              <RegisterForm />

              {/* Security */}
              <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Thông tin tài khoản được bảo mật</span>
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