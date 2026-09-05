import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-center text-base font-medium">Đăng ký</h2>
      {/* TODO: features/auth/components/register-form */}
      <p className="text-center text-sm text-muted-foreground">
        Form đăng ký sẽ được đặt tại <code>features/auth</code>
      </p>
      <p className="text-center text-sm">
        Đã có tài khoản?{" "}
        <Link href="/login" className="underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
