'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { ChildProvider, useChild } from '@/context/ChildContext'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const NAV_HREFS = [
  { href: '/parent/dashboard', icon: '🏠', key: 'dashboard.parent.navHome'       },
  { href: '/parent/grades',    icon: '📊', key: 'dashboard.parent.navGrades'     },
  { href: '/parent/attendance',icon: '📅', key: 'dashboard.parent.navAttendance' },
  { href: '/parent/chat',      icon: '🤖', key: 'dashboard.parent.navAI'         },
  { href: '/parent/profile',   icon: '👤', key: 'dashboard.parent.navProfile'    },
]

function ParentLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session }                   = useSession()
  const pathname                            = usePathname()
  const router                              = useRouter()
  const { t }                               = useLanguage()
  const { children: childList, selectedChild, setSelectedChildId, loading } = useChild()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo + school */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-gray-900 leading-tight">{t('dashboard.parent.portalTitle')}</p>
                <p className="text-xs text-gray-400">
                  {t('dashboard.parent.welcome')}, {session?.user?.name?.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Child selector */}
            {!loading && childList.length > 0 && (
              <div className="flex-1 flex justify-center px-4">
                {childList.length === 1 ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-900">{selectedChild?.name}</p>
                    <p className="text-xs text-gray-400">{selectedChild?.className}</p>
                  </div>
                ) : (
                  <select
                    value={selectedChild?.id ?? ''}
                    onChange={e => setSelectedChildId(e.target.value)}
                    className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {childList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.className})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1"
            >
              {t('dashboard.common.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 pb-24 pt-4">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="flex">
            {NAV_HREFS.map(item => {
              const active = item.href === '/parent/dashboard'
                ? pathname === '/parent/dashboard'
                : pathname.startsWith(item.href)
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors min-h-[56px] ${
                    active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <span className="text-xl leading-none">{item.icon}</span>
                  <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : ''}`}>
                    {t(item.key)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChildProvider>
      <ParentLayoutInner>{children}</ParentLayoutInner>
    </ChildProvider>
  )
}
