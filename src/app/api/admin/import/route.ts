import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    if (!user.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 400 })
    }

    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Invalid users data' }, { status: 400 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (existingUser) {
          results.failed++
          results.errors.push(`User ${userData.email} already exists`)
          continue
        }

        // Find class by name if className provided
        let classId = null
        if (userData.className) {
          const foundClass = await prisma.class.findFirst({
            where: {
              name: userData.className,
              schoolId: user.schoolId
            }
          })
          
          if (foundClass) {
            classId = foundClass.id
          } else {
            results.errors.push(`Class ${userData.className} not found for user ${userData.email}`)
          }
        }

        // Create user
        const hashedPassword = userData.password 
          ? await bcrypt.hash(userData.password, 10)
          : null

        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            password: hashedPassword,
            role: userData.role || 'STUDENT',
            subject: userData.subject || null,
            schoolId: user.schoolId,
            classId: classId
          }
        })

        results.success++
      } catch (error: any) {
        results.failed++
        results.errors.push(`Failed to import ${userData.email}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Failed to import users' 
    }, { status: 500 })
  }
}