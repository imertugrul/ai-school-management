import { prisma } from '@/lib/prisma'

export interface ScheduleSlot {
  teacherId: string
  classId?: string | null
  dayOfWeek: number
  startTime: string  // "HH:MM"
  endTime: string    // "HH:MM"
  /** When editing, exclude this Schedule id from conflict checks */
  excludeId?: string
}

export type ValidationError = { code: 'INVALID_TIME' | 'OUTSIDE_HOURS' | 'TEACHER_CONFLICT' | 'CLASS_CONFLICT'; message: string }

function isValidHHMM(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t)
}

/**
 * Validate a schedule slot:
 *  - well-formed HH:MM, start < end
 *  - within school working hours (if school has them set)
 *  - no teacher overlap on the same day (excluding self when editing)
 *  - no class overlap on the same day (excluding self when editing)
 *
 * Returns null when valid, or a ValidationError describing the first failure.
 */
export async function validateScheduleSlot(
  slot: ScheduleSlot,
  schoolId: string | null,
): Promise<ValidationError | null> {
  if (!isValidHHMM(slot.startTime) || !isValidHHMM(slot.endTime)) {
    return { code: 'INVALID_TIME', message: 'Saatler HH:MM formatında olmalı.' }
  }
  if (slot.startTime >= slot.endTime) {
    return { code: 'INVALID_TIME', message: 'Bitiş saati başlangıç saatinden sonra olmalı.' }
  }

  // ── School working hours ─────────────────────────────────────────────────
  if (schoolId) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { schoolStartTime: true, schoolEndTime: true },
    })
    const schoolStart = school?.schoolStartTime ?? '08:00'
    const schoolEnd   = school?.schoolEndTime ?? '17:00'
    if (slot.startTime < schoolStart || slot.endTime > schoolEnd) {
      return {
        code: 'OUTSIDE_HOURS',
        message: `Ders saatleri okul çalışma saatleri (${schoolStart}–${schoolEnd}) dışında.`,
      }
    }
  }

  // ── Teacher overlap on same day ──────────────────────────────────────────
  const teacherConflict = await prisma.schedule.findFirst({
    where: {
      teacherId: slot.teacherId,
      dayOfWeek: slot.dayOfWeek,
      isActive: true,
      ...(slot.excludeId ? { id: { not: slot.excludeId } } : {}),
      // [a,b) overlaps [c,d) iff a<d AND c<b
      startTime: { lt: slot.endTime },
      endTime: { gt: slot.startTime },
    },
    select: { startTime: true, endTime: true },
  })
  if (teacherConflict) {
    return {
      code: 'TEACHER_CONFLICT',
      message: `Bu saatte zaten bir dersiniz var: ${teacherConflict.startTime}–${teacherConflict.endTime}.`,
    }
  }

  // ── Class overlap on same day ────────────────────────────────────────────
  if (slot.classId) {
    const classConflict = await prisma.schedule.findFirst({
      where: {
        classId: slot.classId,
        dayOfWeek: slot.dayOfWeek,
        isActive: true,
        ...(slot.excludeId ? { id: { not: slot.excludeId } } : {}),
        startTime: { lt: slot.endTime },
        endTime: { gt: slot.startTime },
      },
      select: { startTime: true, endTime: true, course: { select: { code: true } } },
    })
    if (classConflict) {
      return {
        code: 'CLASS_CONFLICT',
        message: `Bu sınıfın aynı saatte başka bir dersi var (${classConflict.course?.code ?? ''} ${classConflict.startTime}–${classConflict.endTime}).`,
      }
    }
  }

  return null
}

export async function getSchoolHours(schoolId: string | null): Promise<{ start: string; end: string }> {
  if (!schoolId) return { start: '08:00', end: '17:00' }
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { schoolStartTime: true, schoolEndTime: true },
  })
  return {
    start: school?.schoolStartTime ?? '08:00',
    end: school?.schoolEndTime ?? '17:00',
  }
}
