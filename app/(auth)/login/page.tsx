import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-medium">Đăng nhập</h2>
      {/* TODO: features/auth/components/login-form */}
      <p className="text-center text-sm text-muted-foreground">
        Form đăng nhập sẽ được đặt tại <code>features/auth</code>
      </p>
      <p className="text-center text-sm">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="underline">
          Đăng ký
        </Link>
      </p>
    </div>
  )
}
