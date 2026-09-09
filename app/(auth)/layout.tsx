import { CheckSquare } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(60rem 60rem at 50% -20%, hsl(var(--primary) / 0.12), transparent 60%), radial-gradient(40rem 40rem at 100% 100%, hsl(var(--chart-2) / 0.08), transparent 55%)",
        }}
      />
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft-lg">
            <CheckSquare className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Task Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý công việc gọn gàng, đúng người, đúng việc.
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-soft-lg">{children}</div>
      </div>
    </div>
  )
}
