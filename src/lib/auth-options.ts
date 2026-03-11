import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValid = await verifyPassword(credentials.password, user.password)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })

        if (!existingUser) {
          // Yeni kullanıcı - varsayılan olarak STUDENT
          // Admin tarafından CSV import ile veya manuel olarak düzenlenebilir
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || '',
              image: user.image,
              role: 'STUDENT' // Default role
            }
          })
        }
        // Eğer kullanıcı zaten varsa (CSV ile import edilmişse),
        // mevcut role'ü kullan - değiştirme!
      }
      return true
    },
    async jwt({ token, user, account }) {
      // For credentials login
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      
      // For OAuth, always fetch fresh role from database
      if (account?.provider === 'google' || !token.role) {
        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { role: true, id: true }
          })
          if (dbUser) {
            token.role = dbUser.role
            token.id = dbUser.id
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // After successful login, redirect based on URL or default to home
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt'
  }
}
