import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const trainer = await db.trainer.findUnique({
          where: { email: parsed.data.email },
        })

        if (!trainer) return null

        const isValid = await bcrypt.compare(
          parsed.data.password,
          trainer.passwordHash,
        )
        if (!isValid) return null

        return {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
