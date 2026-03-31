import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  classId?: string
  status?: 'PENDING' | 'ACTIVE'
}) {
  const hashedPassword = await hashPassword(data.password)

  return prisma.user.create({
    data: {
      name:     data.name,
      email:    data.email,
      password: hashedPassword,
      role:     data.role,
      classId:  data.classId,
      status:   data.status ?? 'PENDING',
    }
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.password) {
    return null
  }

  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    return null
  }

  return user
}
