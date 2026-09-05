import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: { signIn: "/login" },
})

export const config = {
  // Bảo vệ dashboard và API cần auth; bỏ qua /login, /register, /api/auth/*
  matcher: [
    "/",
    "/projects/:path*",
    "/tasks/:path*",
    "/users/:path*",
    "/api/users/:path*",
    "/api/projects/:path*",
    "/api/tasks/:path*",
  ],
}
