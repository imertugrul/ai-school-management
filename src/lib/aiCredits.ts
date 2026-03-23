import { prisma } from '@/lib/prisma'

export interface CreditCheckResult {
  allowed: boolean
  creditsUsed: number
  creditsLimit: number
}

/**
 * Check if AI credits are available for a school.
 * Returns { allowed: false } with usage data if limit is reached.
 * If schoolId is null, credits are not enforced (returns allowed: true).
 */
export async function checkAiCredits(schoolId: string | null): Promise<CreditCheckResult> {
  if (!schoolId) return { allowed: true, creditsUsed: 0, creditsLimit: 0 }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { aiCreditsUsed: true, aiCreditsLimit: true, aiCreditsResetAt: true },
  })

  if (!school) return { allowed: true, creditsUsed: 0, creditsLimit: 0 }

  // Monthly reset: if resetAt is null or older than 30 days, reset credits
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const needsReset = !school.aiCreditsResetAt || school.aiCreditsResetAt < thirtyDaysAgo

  if (needsReset) {
    await prisma.school.update({
      where: { id: schoolId },
      data: { aiCreditsUsed: 0, aiCreditsResetAt: now },
    })
    return { allowed: true, creditsUsed: 0, creditsLimit: school.aiCreditsLimit }
  }

  if (school.aiCreditsUsed >= school.aiCreditsLimit) {
    return {
      allowed: false,
      creditsUsed: school.aiCreditsUsed,
      creditsLimit: school.aiCreditsLimit,
    }
  }

  return {
    allowed: true,
    creditsUsed: school.aiCreditsUsed,
    creditsLimit: school.aiCreditsLimit,
  }
}

/**
 * Consume AI credits after a successful API call.
 * tokens / 1000 = credits consumed (rounded up to nearest 0.1).
 * If schoolId is null, does nothing.
 */
export async function consumeAiCredits(schoolId: string | null, tokens: number): Promise<void> {
  if (!schoolId || tokens <= 0) return

  const credits = Math.ceil(tokens / 1000)

  await prisma.school.update({
    where: { id: schoolId },
    data: { aiCreditsUsed: { increment: credits } },
  })
}
