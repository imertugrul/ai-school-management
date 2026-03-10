import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const userType = formData.get('userType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    const header = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1)

    let imported = 0
    const errors: any[] = []

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].split(',').map(v => v.trim())
      const rowData: any = {}
      
      header.forEach((key, index) => {
        rowData[key] = values[index] || ''
      })

      try {
        if (userType === 'STUDENT') {
          // Find class by name
          const studentClass = await prisma.class.findFirst({
            where: { name: rowData.className }
          })

          if (!studentClass) {
            errors.push({ row: i + 2, error: `Class "${rowData.className}" not found` })
            continue
          }

          // Hash password
          const hashedPassword = await hashPassword(rowData.password)

          await prisma.user.create({
            data: {
              name: rowData.name,
              email: rowData.email,
              password: hashedPassword,
              role: 'STUDENT',
              classId: studentClass.id
            }
          })
          imported++
        } else if (userType === 'TEACHER') {
          // Hash password
          const hashedPassword = await hashPassword(rowData.password)

          await prisma.user.create({
            data: {
              name: rowData.name,
              email: rowData.email,
              password: hashedPassword,
              role: 'TEACHER'
            }
          })
          imported++
        }
      } catch (error: any) {
        errors.push({ row: i + 2, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({ 
      error: 'Failed to import users' 
    }, { status: 500 })
  }
}
