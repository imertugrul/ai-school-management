import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!teacher || teacher.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Only teachers can view analytics' }, { status: 403 })
    }

    // Get all tests created by this teacher
    const tests = await prisma.test.findMany({
      where: { createdById: teacher.id },
      include: {
        submissions: {
          include: {
            student: {
              select: { name: true, email: true }
            }
          }
        },
        questions: true
      }
    })

    // Get attendance records marked by this teacher
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { markedById: teacher.id },
      include: {
        student: {
          select: { name: true, email: true, classId: true }
        },
        class: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 100
    })

    // Calculate statistics
    const totalTests = tests.length
    const totalSubmissions = tests.reduce((sum, test) => sum + test.submissions.length, 0)
    
    const submittedSubmissions = tests.reduce((sum, test) => 
      sum + test.submissions.filter(s => s.status === 'SUBMITTED' || s.status === 'GRADED' || s.status === 'RELEASED').length, 0
    )
    
    const gradedSubmissions = tests.reduce((sum, test) => 
      sum + test.submissions.filter(s => s.status === 'GRADED' || s.status === 'RELEASED').length, 0
    )

    // Attendance statistics
    const totalAttendanceRecords = attendanceRecords.length
    const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT').length
    const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length
    const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length
    const excusedCount = attendanceRecords.filter(r => r.status === 'EXCUSED').length

    // Attendance by date (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentAttendance = attendanceRecords.filter(r => r.date >= thirtyDaysAgo)
    
    // Group by date
    const attendanceByDate = recentAttendance.reduce((acc: any, record) => {
      const dateKey = record.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, present: 0, absent: 0, late: 0, excused: 0 }
      }
      if (record.status === 'PRESENT') acc[dateKey].present++
      if (record.status === 'ABSENT') acc[dateKey].absent++
      if (record.status === 'LATE') acc[dateKey].late++
      if (record.status === 'EXCUSED') acc[dateKey].excused++
      return acc
    }, {})

    const attendanceChartData = Object.values(attendanceByDate)

    // Test performance data
    const testPerformance = tests.map(test => {
      const submissions = test.submissions.filter(s => s.status === 'RELEASED')
      const avgScore = submissions.length > 0
        ? submissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / submissions.length
        : 0
      
      return {
        name: test.title.length > 20 ? test.title.substring(0, 20) + '...' : test.title,
        avgScore: Math.round(avgScore),
        submissions: submissions.length,
        totalStudents: test.submissions.length
      }
    }).slice(0, 10) // Top 10 tests

    return NextResponse.json({
      success: true,
      stats: {
        totalTests,
        totalSubmissions,
        submittedSubmissions,
        gradedSubmissions,
        totalAttendanceRecords,
        presentCount,
        absentCount,
        lateCount,
        excusedCount
      },
      charts: {
        attendanceByDate: attendanceChartData,
        testPerformance
      }
    })

  } catch (error: any) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ 
      error: 'Failed to get analytics' 
    }, { status: 500 })
  }
}
