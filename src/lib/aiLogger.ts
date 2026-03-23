/**
 * AI audit logger for KVKK / GDPR compliance.
 * Every AI API call should be logged via logAiCall().
 * hasPersonalData must always be false — if it's true, the prompt was not anonymized correctly.
 */
import { prisma } from '@/lib/prisma'

export async function logAiCall(params: {
  endpoint: string
  tokensUsed: number
  hasPersonalData?: boolean
}): Promise<void> {
  try {
    await prisma.aiLog.create({
      data: {
        endpoint:        params.endpoint,
        tokensUsed:      params.tokensUsed,
        hasPersonalData: params.hasPersonalData ?? false,
      },
    })
  } catch (err) {
    // Logging must never break the main flow
    console.error('AiLog write failed:', err)
  }
}
