import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { memLoginLimiter } from '@/lib/ratelimit'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        // ── Rate limit by IP (in-memory fallback; use Upstash in production) ──
        const ip     = (req?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown'
        const rl     = memLoginLimiter.limit(`login:${ip}:${credentials.email}`)
        if (!rl.success) return null // silently block; NextAuth treats null as invalid credentials

        const user = await prisma.user.findUnique({
          where:  { email: credentials.email },
          select: { id: true, email: true, name: true, role: true, password: true,
                    twoFactorEnabled: true, twoFactorVerified: true },
        })

        if (!user || !user.password) return null

        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) return null

        return {
          id:               user.id,
          email:            user.email,
          name:             user.name,
          role:             user.role,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorVerified: user.twoFactorVerified,
        }
      },
    }),
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID     || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name:  user.name || '',
              image: user.image,
              role:  'STUDENT',
            },
          })
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session }) {
      // ── Handle session.update() calls (e.g., after 2FA verification) ──
      if (trigger === 'update' && session) {
        if (typeof session.twoFactorPassed === 'boolean') {
          token.twoFactorPassed = session.twoFactorPassed
        }
        return token
      }

      // ── Initial sign-in via credentials ──
      if (user) {
        token.role             = (user as any).role
        token.id               = user.id
        token.twoFactorEnabled = (user as any).twoFactorEnabled ?? false
        // twoFactorPassed: true if 2FA not enabled (no challenge needed)
        //                  false if 2FA enabled — user must complete the 2FA page
        token.twoFactorPassed  = !((user as any).twoFactorEnabled && (user as any).twoFactorVerified)
      }

      // ── OAuth login — fetch fresh data from DB ──
      if (account?.provider === 'google' || !token.role) {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where:  { email: token.email as string },
            select: { role: true, id: true, twoFactorEnabled: true, twoFactorVerified: true },
          })
          if (dbUser) {
            token.role             = dbUser.role
            token.id               = dbUser.id
            token.twoFactorEnabled = dbUser.twoFactorEnabled
            token.twoFactorPassed  = !(dbUser.twoFactorEnabled && dbUser.twoFactorVerified)
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role             = token.role as string
        session.user.id               = token.id as string
        session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
        session.user.twoFactorPassed  = token.twoFactorPassed  as boolean
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },

  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}
