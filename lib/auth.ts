import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"
import type { Role } from "@/app/generated/prisma/client"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name: string
    role: Role
    slug: string
    isActive: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      slug: string
      isActive: boolean
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string
    role?: Role
    slug?: string
    isActive?: boolean
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const trainer = await db.trainer.findUnique({
          where: { email: parsed.data.email },
        })

        if (!trainer || !trainer.isActive) return null

        const isValid = await bcrypt.compare(
          parsed.data.password,
          trainer.passwordHash,
        )
        if (!isValid) return null

        return {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
          role: trainer.role,
          slug: trainer.slug,
          isActive: trainer.isActive,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.slug = user.slug
        token.isActive = user.isActive
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as Role
        session.user.slug = token.slug as string
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error("No autenticado")
  }
  return session.user
}

export async function requireCoachAuth() {
  const user = await requireAuth()
  if (user.role !== "COACH" && user.role !== "SUPERADMIN") {
    throw new Error("Acceso denegado: rol de entrenador requerido")
  }
  return user
}

export async function requireSuperAdminAuth() {
  const user = await requireAuth()
  if (user.role !== "SUPERADMIN") {
    throw new Error("Acceso denegado: rol de SuperAdmin requerido")
  }
  return user
}

