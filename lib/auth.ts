import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        // Không tồn tại tài khoản
        if (!user) {
          return null
        }

        // Tài khoản đã bị Admin vô hiệu hóa
        if (user.isActive === false) {
          throw new Error(
            "Tài khoản của bạn đã bị vô hiệu hóa"
          )
        }

        // Kiểm tra mật khẩu
        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!valid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.role = (user as { role: string }).role
      } else if (trigger === "update" && token.id) {
        try {
          const fresh = await db.user.findUnique({
            where: {
              id: token.id as string,
            },
            select: {
              role: true,
              isActive: true,
            },
          })

          if (fresh) {
            token.role = fresh.role as string
          }
        } catch {
          // Nếu DB lỗi thì giữ token hiện tại
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }

      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}