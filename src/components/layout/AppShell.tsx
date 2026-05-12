'use client'

import { ReactNode } from 'react'
import Sidebar, { SidebarSection } from './Sidebar'
import MobileHeader from './MobileHeader'
import { SidebarProvider } from './SidebarContext'

interface AppShellProps {
  roleLabel?:        string
  sections:          SidebarSection[]
  mobileTitle?:      string
  mobileHeaderAction?: ReactNode
  children:          ReactNode
}

export default function AppShell({
  roleLabel, sections, mobileTitle, mobileHeaderAction, children,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[var(--sp-bg)] text-[var(--sp-text-primary)]">
        <Sidebar roleLabel={roleLabel} sections={sections} />
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <MobileHeader title={mobileTitle} action={mobileHeaderAction} />
          <main className="flex-1 min-w-0 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
