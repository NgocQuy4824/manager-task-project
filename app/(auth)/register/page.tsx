import { RegisterForm } from "@/features/auth/components/register-form"

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-medium">Đăng ký</h2>
      <RegisterForm />
    </div>
  )
}
