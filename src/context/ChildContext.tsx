'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface Child {
  id: string
  name: string
  className: string
  classId: string | null
}

interface ChildContextType {
  children: Child[]
  selectedChild: Child | null
  setSelectedChildId: (id: string) => void
  loading: boolean
}

const ChildContext = createContext<ChildContextType>({
  children: [],
  selectedChild: null,
  setSelectedChildId: () => {},
  loading: true,
})

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [children, setChildren]       = useState<Child[]>([])
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    fetch('/api/parent/children')
      .then(r => r.json())
      .then(d => {
        const list: Child[] = d.children ?? []
        setChildren(list)
        if (list.length > 0) {
          const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedChildId') : null
          const valid = saved && list.some(c => c.id === saved)
          setSelectedId(valid ? saved : list[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function setSelectedChildId(id: string) {
    setSelectedId(id)
    if (typeof window !== 'undefined') localStorage.setItem('selectedChildId', id)
  }

  const selectedChild = children.find(c => c.id === selectedId) ?? null

  return (
    <ChildContext.Provider value={{ children, selectedChild, setSelectedChildId, loading }}>
      {reactChildren}
    </ChildContext.Provider>
  )
}

export function useChild() {
  return useContext(ChildContext)
}
