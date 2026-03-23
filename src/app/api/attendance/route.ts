import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

// GET - Get attendance for a class on a specific date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    if (!classId || !date) {
      return NextResponse.json({ error: 'Missing classId or date' }, { status: 400 })
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const records = await prisma.attendanceRecord.findMany({
      where: {
        classId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Fetch absence notification statuses for these records
    const recordIds = records.map(r => r.id)
    const notifMap: Record<string, string> = {}
    if (recordIds.length > 0) {
      const notifs = await prisma.absenceNotification.findMany({
        where: { attendanceId: { in: recordIds } },
        select: { attendanceId: true, status: true },
      })
      notifs.forEach(n => { notifMap[n.attendanceId] = n.status })
    }

    const attendanceData = classData.students.map(student => {
      const record = records.find(r => r.studentId === student.id)
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        status: record?.status || null,
        notes: record?.notes || null,
        recordId: record?.id || null,
        notificationStatus: record ? (notifMap[record.id] ?? null) : null,
      }
    })

    return NextResponse.json({
      success: true,
      class: {
        id: classData.id,
        name: classData.name
      },
      date,
      attendance: attendanceData
    })

  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ 
      error: 'Failed to get attendance' 
    }, { status: 500 })
  }
}

// POST - Mark attendance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can mark attendance' }, { status: 403 })
    }

    const { classId, date, attendance } = await request.json()

    if (!classId || !date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(12, 0, 0, 0)

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { name: true }
    })

    const records = await Promise.all(
      attendance.map(async (item: any) => {
        const record = await prisma.attendanceRecord.upsert({
          where: {
            studentId_date: {
              studentId: item.studentId,
              date: attendanceDate
            }
          },
          create: {
            studentId: item.studentId,
            classId,
            date: attendanceDate,
            status: item.status,
            notes: item.notes || null,
            markedById: teacher.id
          },
          update: {
            status: item.status,
            notes: item.notes || null,
            markedById: teacher.id
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })

        if (item.status === 'ABSENT' || item.status === 'LATE') {
          try {
            // Check if notification already exists for this attendance record
            const existing = await prisma.absenceNotification.findUnique({
              where: { attendanceId: record.id },
            })
            if (existing) {
              // If correcting back to ABSENT/LATE on a CORRECTED notification, reset to PENDING
              if (existing.status === 'CORRECTED') {
                await prisma.absenceNotification.update({
                  where: { id: existing.id },
                  data: { status: 'PENDING', correctedTo: null, reviewedById: null, reviewedAt: null },
                })
              }
            } else {
              await prisma.absenceNotification.create({
                data: {
                  studentId: item.studentId,
                  classId,
                  attendanceId: record.id,
                  markedById: teacher.id,
                  date: attendanceDate,
                  status: 'PENDING',
                },
              })
            }
          } catch (notifError) {
            console.error('AbsenceNotification create error:', notifError)
          }
        } else {
          // Status changed to PRESENT/EXCUSED — cancel any pending notification
          try {
            const existing = await prisma.absenceNotification.findUnique({
              where: { attendanceId: record.id },
            })
            if (existing && existing.status === 'PENDING') {
              await prisma.absenceNotification.update({
                where: { id: existing.id },
                data: { status: 'CORRECTED', correctedTo: item.status, originalStatus: existing.status },
              })
            }
          } catch (e) {
            console.error('AbsenceNotification correction error:', e)
          }
        }

        return record
      })
    )

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      records: records.length,
    })

  } catch (error: any) {
    console.error('Mark attendance error:', error)
    return NextResponse.json({ 
      error: 'Failed to mark attendance',
      details: error.message
    }, { status: 500 })
  }
}
