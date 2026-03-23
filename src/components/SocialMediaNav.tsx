'use client'

import { useRouter, usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

const NAV_ITEMS = [
  { href: '/social-media-hub/dashboard',       icon: '🏠', label: 'Dashboard'       },
  { href: '/social-media-hub/create',          icon: '✏️', label: 'Create Post'     },
  { href: '/social-media-hub/posts',           icon: '📄', label: 'My Posts'        },
  { href: '/social-media-hub/calendar',        icon: '📅', label: 'Calendar'        },
  { href: '/social-media-hub/content-library', icon: '🗂️', label: 'Content Library' },
  { href: '/social-media-hub/brand',           icon: '🎨', label: 'Brand Settings'  },
  { href: '/social-media-hub/accounts',        icon: '🔗', label: 'Accounts'        },
]

export default function SocialMediaNav() {
  const router   = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const initials = (session?.user?.name || 'S')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">S</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Social Media Hub</h1>
              <p className="text-xs text-gray-500">Content Portal</p>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-pink-50 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              )
            })}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="btn-secondary text-xs hidden sm:block"
            >
              Logout
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
