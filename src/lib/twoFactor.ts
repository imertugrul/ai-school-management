/**
 * TOTP-based Two-Factor Authentication helpers.
 * Uses otplib v13 (RFC 6238) + qrcode for setup.
 */
import { generateSecret as otpGenerateSecret, generateURI, verify as otpVerify } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

const APP_NAME = process.env.APP_NAME || 'SchoolPro'

// ── Secret generation ─────────────────────────────────────────────────────────

/**
 * Generate a new TOTP secret for a user and persist it (not yet enabled).
 * Returns the secret and a QR code data URL.
 */
export async function generateSecret(userId: string, email: string): Promise<{
  secret:  string
  otpauth: string
  qrCode:  string
}> {
  const secret  = otpGenerateSecret({ length: 20 })
  const otpauth = generateURI({ strategy: 'totp', issuer: APP_NAME, label: email, secret })
  const qrCode  = await QRCode.toDataURL(otpauth)

  // Store secret; do NOT enable 2FA yet — user must verify first
  await prisma.user.update({
    where: { id: userId },
    data:  { twoFactorSecret: secret, twoFactorVerified: false, twoFactorEnabled: false },
  })

  return { secret, otpauth, qrCode }
}

// ── Verification ──────────────────────────────────────────────────────────────

/**
 * Verify a 6-digit TOTP code against the user's stored secret.
 */
export async function verifyToken(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { twoFactorSecret: true },
  })
  if (!user?.twoFactorSecret) return false

  try {
    const result = await otpVerify({ token, secret: user.twoFactorSecret, strategy: 'totp' })
    return !!(result as any)?.valid
  } catch {
    return false
  }
}

/**
 * Enable 2FA after the user successfully verifies their first token.
 */
export async function enableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { twoFactorEnabled: true, twoFactorVerified: true },
  })
}

/**
 * Disable 2FA and clear the stored secret.
 */
export async function disableTwoFactor(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data:  { twoFactorEnabled: false, twoFactorSecret: null, twoFactorVerified: false },
  })
}
