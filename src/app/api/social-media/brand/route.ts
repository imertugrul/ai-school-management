import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const schoolId = user.schoolId ?? user.id  // fallback to userId if no school

    const brand = await prisma.brandSettings.findUnique({ where: { schoolId } })
    return NextResponse.json({ success: true, brand })
  } catch (error: any) {
    console.error('GET /api/social-media/brand error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const schoolId = user.schoolId ?? user.id

    const body = await request.json()
    const {
      primaryColor, secondaryColor, accentColor,
      logoUrl, coverUrl, organizationName, tagline,
      voiceTone, hashtags, forbiddenWords,
      instagramHandle, twitterHandle, facebookPage,
      linkedinPage, youtubeChannel, tiktokHandle,
    } = body

    const data: any = {
      ...(primaryColor     !== undefined && { primaryColor }),
      ...(secondaryColor   !== undefined && { secondaryColor }),
      ...(accentColor      !== undefined && { accentColor }),
      ...(logoUrl          !== undefined && { logoUrl }),
      ...(coverUrl         !== undefined && { coverUrl }),
      ...(organizationName !== undefined && { organizationName }),
      ...(tagline          !== undefined && { tagline }),
      ...(voiceTone        !== undefined && { voiceTone }),
      ...(hashtags         !== undefined && { hashtags }),
      ...(forbiddenWords   !== undefined && { forbiddenWords }),
      ...(instagramHandle  !== undefined && { instagramHandle }),
      ...(twitterHandle    !== undefined && { twitterHandle }),
      ...(facebookPage     !== undefined && { facebookPage }),
      ...(linkedinPage     !== undefined && { linkedinPage }),
      ...(youtubeChannel   !== undefined && { youtubeChannel }),
      ...(tiktokHandle     !== undefined && { tiktokHandle }),
    }

    const brand = await prisma.brandSettings.upsert({
      where:  { schoolId },
      create: { schoolId, ...data },
      update: data,
    })

    return NextResponse.json({ success: true, brand })
  } catch (error: any) {
    console.error('PUT /api/social-media/brand error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
