/**
 * Rate limiting helpers.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Falls back to in-memory Map-based limiting (single-instance / dev).
 *
 *  loginLimiter  — 5 attempts / 15 minutes  (login failures)
 *  apiLimiter    — 100 requests / 1 minute  (general API)
 *  adminLimiter  — 20 requests / 1 minute   (manage-panel)
 */

// ── In-memory fallback (Node.js only — does NOT persist in Edge Runtime) ─────
class MemoryRatelimit {
  private windows = new Map<string, number[]>()
  constructor(private max: number, private windowMs: number) {}

  limit(id: string): { success: boolean; remaining: number; reset: number } {
    const now  = Date.now()
    const hits = (this.windows.get(id) ?? []).filter(t => now - t < this.windowMs)
    if (hits.length >= this.max) {
      return { success: false, remaining: 0, reset: hits[0] + this.windowMs }
    }
    hits.push(now)
    this.windows.set(id, hits)
    return { success: true, remaining: this.max - hits.length, reset: now + this.windowMs }
  }
}

export const memLoginLimiter = new MemoryRatelimit(5,   15 * 60 * 1000)
export const memApiLimiter   = new MemoryRatelimit(100, 60 * 1000)
export const memAdminLimiter = new MemoryRatelimit(20,  60 * 1000)

// ── Upstash factory (lazy, singleton) ────────────────────────────────────────
type UpstashDuration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}`

function hasUpstash() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

let _loginLimiter: any = null
let _apiLimiter:   any = null
let _adminLimiter: any = null

async function buildUpstash(requests: number, window: UpstashDuration) {
  const { Ratelimit } = await import('@upstash/ratelimit')
  const { Redis }     = await import('@upstash/redis')
  return new Ratelimit({
    redis:    Redis.fromEnv(),
    limiter:  Ratelimit.slidingWindow(requests, window),
    analytics: false,
  })
}

export async function getLoginLimiter() {
  if (!hasUpstash()) return null
  if (!_loginLimiter) _loginLimiter = await buildUpstash(5, '15 m')
  return _loginLimiter as { limit: (id: string) => Promise<{ success: boolean; remaining: number }> }
}

export async function getApiLimiter() {
  if (!hasUpstash()) return null
  if (!_apiLimiter) _apiLimiter = await buildUpstash(100, '1 m')
  return _apiLimiter as { limit: (id: string) => Promise<{ success: boolean; remaining: number }> }
}

export async function getAdminLimiter() {
  if (!hasUpstash()) return null
  if (!_adminLimiter) _adminLimiter = await buildUpstash(20, '1 m')
  return _adminLimiter as { limit: (id: string) => Promise<{ success: boolean; remaining: number }> }
}

/**
 * Unified rate-limit check. Falls back to in-memory when Upstash is not configured.
 */
export async function checkRateLimit(
  identifier: string,
  type: 'login' | 'api' | 'admin' = 'api'
): Promise<{ success: boolean; remaining: number }> {
  if (hasUpstash()) {
    const limiter =
      type === 'login' ? await getLoginLimiter() :
      type === 'admin' ? await getAdminLimiter() :
                         await getApiLimiter()
    if (limiter) return limiter.limit(identifier)
  }
  const mem =
    type === 'login' ? memLoginLimiter :
    type === 'admin' ? memAdminLimiter :
                       memApiLimiter
  return mem.limit(identifier)
}
