'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TestEditor, { type QItem, type BItem, type TestItem, type QType, type BType } from '@/components/TestEditor'

export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string

  const [loading, setLoading] = useState(true)
  const [initialMeta, setInitialMeta] = useState<any>(null)
  const [initialItems, setInitialItems] = useState<TestItem[] | null>(null)

  useEffect(() => {
    fetch(`/api/tests/${testId}`)
      .then(r => r.json())
      .then(data => {
        if (!data.success) return
        const t = data.test
        setInitialMeta({
          title:       t.title,
          subject:     t.subject     ?? '',
          description: t.description ?? '',
          startDate:   t.startDate   ? new Date(t.startDate).toISOString().slice(0, 16) : '',
          endDate:     t.endDate     ? new Date(t.endDate).toISOString().slice(0, 16)   : '',
          isActive:    t.isActive    ?? false,
          category:    t.category    ?? 'QUIZ',
        })

        // Build unified item list ordered by orderIndex
        const questions: TestItem[] = (t.questions ?? []).map((q: any) => ({
          kind:          'question' as const,
          tempId:        q.id,
          type:          q.type as QType,
          content:       q.content,
          points:        q.points,
          options:       q.options  ? (Array.isArray(q.options) ? q.options : undefined) : undefined,
          correctAnswer: q.correctAnswer ?? '',
          config:        q.config   ?? undefined,
          rubric:        (q.rubric as any)?.criteria ?? q.rubric ?? '',
          tags:          q.tags     ?? [],
          orderIndex:    q.orderIndex,
        }))

        const blocks: TestItem[] = (t.contentBlocks ?? []).map((b: any) => ({
          kind:       'block' as const,
          tempId:     b.id,
          blockType:  b.type as BType,
          content:    b.content,
          orderIndex: b.orderIndex,
        }))

        // Merge and sort by orderIndex
        const merged = [...questions, ...blocks].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
        setInitialItems(merged)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [testId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <TestEditor
      mode="edit"
      testId={testId}
      initialMeta={initialMeta ?? undefined}
      initialItems={initialItems ?? []}
    />
  )
}
