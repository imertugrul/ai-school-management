import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT',
        schoolId: admin.schoolId
      },
      include: {
        parentLinks: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                class: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, parents })
  } catch (error) {
    console.error('Admin parents GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!admin || admin.role !== 'ADMIN' || !admin.schoolId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { parentEmail, parentName, studentId, relationship } = body

    // Check if parent user exists
    let parentUser = await prisma.user.findUnique({
      where: { email: parentEmail }
    })

    let tempPassword: string | null = null

    if (!parentUser) {
      // Create new parent user with random password
      tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
      const hashedPassword = await hashPassword(tempPassword)

      parentUser = await prisma.user.create({
        data: {
          email: parentEmail,
          name: parentName || parentEmail.split('@')[0],
          password: hashedPassword,
          role: 'PARENT',
          status: 'ACTIVE',
          schoolId: admin.schoolId
        }
      })
    } else if (!parentUser.schoolId) {
      // Update school if not set
      await prisma.user.update({
        where: { id: parentUser.id },
        data: { schoolId: admin.schoolId, role: 'PARENT' }
      })
    }

    // Create parent-student link
    const link = await prisma.parentStudent.upsert({
      where: {
        parentId_studentId: {
          parentId: parentUser.id,
          studentId
        }
      },
      update: { relationship: relationship || 'Guardian' },
      create: {
        parentId: parentUser.id,
        studentId,
        relationship: relationship || 'Guardian'
      }
    })

    return NextResponse.json({
      success: true,
      link,
      parentId: parentUser.id,
      tempPassword
    })
  } catch (error) {
    console.error('Admin parents POST error:', error)
    return NextResponse.json({ error: 'Failed to create parent link' }, { status: 500 })
  }
}
