"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  SessionProvider,
  signOut,
  useSession,
} from "next-auth/react"

import {
  QueryClientProvider,
} from "@tanstack/react-query"

import { getQueryClient } from "@/lib/query-client"
import { Toaster } from "@/components/ui/toast"

/**
 * Kiểm tra tài khoản hiện tại còn hoạt động không.
 *
 * API này sẽ sử dụng getSession() ở server.
 * Nếu User bị xóa hoặc isActive = false
 * → API trả về 401.
 */
function SessionGuard() {
  const router = useRouter()
  const pathname = usePathname()

  const {
    status,
  } = useSession()

  useEffect(() => {
    /**
     * Chưa đăng nhập thì không cần kiểm tra.
     *
     * Trang login cũng không cần kiểm tra.
     */
    if (
      status !== "authenticated" ||
      pathname === "/login"
    ) {
      return
    }

    let stopped = false

    const checkAccount = async () => {
      try {
        const response =
          await fetch(
            "/api/auth/check-session",
            {
              method: "GET",
              cache: "no-store",
            }
          )

        /**
         * User đã bị:
         *
         * - Xóa
         * - Vô hiệu hóa
         *
         * → backend trả 401
         */
        if (
          response.status === 401 &&
          !stopped
        ) {
          stopped = true

          await signOut({
            callbackUrl: "/login",
          })
        }
      } catch (error) {
        /**
         * Không tự logout chỉ vì mạng
         * hoặc server tạm thời lỗi.
         */
        console.error(
          "Session check error:",
          error
        )
      }
    }

    /**
     * Kiểm tra ngay khi component chạy.
     */
    checkAccount()

    /**
     * Sau đó kiểm tra mỗi 5 giây.
     */
    const interval =
      window.setInterval(
        checkAccount,
        5000
      )

    return () => {
      stopped = true
      window.clearInterval(
        interval
      )
    }
  }, [
    status,
    pathname,
    router,
  ])

  return null
}

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient =
    getQueryClient()

  return (
    <SessionProvider>
      <SessionGuard />

      <QueryClientProvider
        client={queryClient}
      >
        {children}

        <Toaster />
      </QueryClientProvider>
    </SessionProvider>
  )
}