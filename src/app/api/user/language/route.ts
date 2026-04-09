import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { language } = body

  if (language !== 'tr' && language !== 'en') {
    return NextResponse.json({ error: 'Invalid language' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { language },
  })

  return NextResponse.json({ ok: true, language })
}
