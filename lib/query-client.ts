import { QueryClient } from "@tanstack/react-query"

let browserQueryClient: QueryClient | undefined

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: luôn tạo mới để không share cache giữa các request
    return makeQueryClient()
  }
  // Browser: singleton
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
