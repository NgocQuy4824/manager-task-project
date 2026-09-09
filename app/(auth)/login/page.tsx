import { Suspense } from "react"
import { LoginForm } from "@/features/auth/components/login-form"

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-medium">Đăng nhập</h2>
      <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Đang tải...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
