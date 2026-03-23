/**
 * Anonymization helpers for KVKK / GDPR compliance.
 *
 * No student name, email, ID, class name, or school name must ever be
 * included in prompts sent to third-party AI providers (OpenAI, Anthropic).
 *
 * Use these helpers on every piece of data before constructing an AI prompt.
 */

/** Fields that may appear on a submission or student object */
interface SubmissionLike {
  id?: string
  studentId?: string
  response?: string
  [key: string]: unknown
}

/**
 * Strip all personal identifiers from a submission object.
 * Returns only the answer content that is safe to send to an AI provider.
 */
export function anonymizeStudentData(submission: SubmissionLike): { response: string } {
  return { response: submission.response ?? '' }
}

// Patterns that identify personal data in free text
const PERSONAL_DATA_PATTERNS: RegExp[] = [
  // Emails
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  // Turkish national ID (11 digits starting with non-zero)
  /\b[1-9]\d{10}\b/g,
  // Common name prefixes followed by capitalized words (rough heuristic)
  /\b(Mr\.|Mrs\.|Ms\.|Dr\.|Öğr\.|Öğrenci:)\s+[A-ZÇĞİÖŞÜ][a-zçğışöüA-ZÇĞİÖŞÜ]+(\s+[A-ZÇĞİÖŞÜ][a-zçğışöüA-ZÇĞİÖŞÜ]+)?\b/g,
]

/**
 * Scan free-form text and replace any detected personal data patterns
 * with a neutral placeholder before sending to an AI provider.
 */
export function anonymizeForAI(text: string): string {
  let result = text
  for (const pattern of PERSONAL_DATA_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

/**
 * Returns true if the text appears to contain personal data.
 * Used for audit logging (hasPersonalData field).
 */
export function containsPersonalData(text: string): boolean {
  return PERSONAL_DATA_PATTERNS.some(p => {
    p.lastIndex = 0
    return p.test(text)
  })
}
