/**
 * Role-based permission system.
 * Extend PERMISSIONS map as new roles/features are added.
 */

export type Permission =
  | 'attendance.review'
  | 'attendance.correct'
  | 'attendance.view'
  | 'students.view'
  | 'students.manage'
  | 'announcements.create'
  | 'announcements.edit_own'
  | 'announcements.edit_any'
  | 'events.create'
  | 'events.edit_own'
  | 'events.edit_any'
  | 'reports.attendance'
  | 'schedule.view'
  | 'grades.view'
  | 'grades.manage'
  | 'staff.manage'
  | 'settings.manage'

type Role = 'ADMIN' | 'VICE_PRINCIPAL' | 'COUNSELOR' | 'SECRETARY' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'SOCIAL_MEDIA_MANAGER'

const PERMISSIONS: Record<Role, Permission[] | ['*']> = {
  ADMIN: ['*'],

  VICE_PRINCIPAL: [
    'attendance.review',
    'attendance.correct',
    'attendance.view',
    'students.view',
    'announcements.create',
    'announcements.edit_own',
    'events.create',
    'events.edit_own',
    'reports.attendance',
    'schedule.view',
  ],

  COUNSELOR: [
    'students.view',
    'attendance.view',
    'reports.attendance',
    'schedule.view',
  ],

  SECRETARY: [
    'announcements.create',
    'announcements.edit_own',
    'events.create',
    'events.edit_own',
    'students.view',
    'schedule.view',
  ],

  TEACHER: [
    'attendance.view',
    'attendance.review',
    'grades.view',
    'grades.manage',
    'students.view',
    'announcements.create',
    'announcements.edit_own',
    'schedule.view',
  ],

  STUDENT: [
    'grades.view',
    'schedule.view',
    'attendance.view',
  ],

  PARENT: [
    'attendance.view',
    'grades.view',
  ],

  SOCIAL_MEDIA_MANAGER: [
    'announcements.create',
    'announcements.edit_own',
  ],
}

export function hasPermission(role: string, permission: Permission): boolean {
  const perms = PERMISSIONS[role as Role]
  if (!perms) return false
  if (perms[0] === '*') return true
  return (perms as Permission[]).includes(permission)
}

/** Roles that can access the /staff-panel */
export const STAFF_ROLES: Role[] = ['VICE_PRINCIPAL', 'COUNSELOR', 'SECRETARY']

/** Role display labels */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN:                'Yönetici',
  VICE_PRINCIPAL:       'Müdür Yardımcısı',
  COUNSELOR:            'Rehber Öğretmen',
  SECRETARY:            'Sekreter',
  TEACHER:              'Öğretmen',
  STUDENT:              'Öğrenci',
  PARENT:               'Veli',
  SOCIAL_MEDIA_MANAGER: 'Sosyal Medya Yöneticisi',
}

/** Dashboard URL for each role */
export function dashboardUrl(role: string): string {
  switch (role) {
    case 'ADMIN':                return '/manage-panel'
    case 'VICE_PRINCIPAL':
    case 'COUNSELOR':
    case 'SECRETARY':            return '/staff-panel'
    case 'TEACHER':              return '/teacher/dashboard'
    case 'SOCIAL_MEDIA_MANAGER': return '/social-media-hub/dashboard'
    case 'PARENT':               return '/parent/dashboard'
    default:                     return '/student/dashboard'
  }
}
