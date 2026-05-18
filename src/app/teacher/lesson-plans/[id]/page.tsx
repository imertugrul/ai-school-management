'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Course { id: string; code: string; name: string }
interface ClassItem { id: string; name: string }
interface SlideItem { slide: number; title: string; duration: number; content: string[]; notes: string }
interface ActivityItem { name: string; duration: number; description: string; grouping: string }
interface Assessment { formative: string[]; summative: string[]; exitTicket: string }

interface LessonPlan {
  id: string
  title: string
  date: string
  duration: number
  // Manual fields
  objectives: string
  materials: string | null
  activities: string
  assessment: string | null
  homework: string | null
  notes: string | null
  // AI fields (JSON-stringified)
  curriculumType: string | null
  unitName: string | null
  learningObjectives: string | null
  materialsNeeded: string | null
  slideOutline: string | null
  aiActivities: string | null
  aiAssessment: string | null
  teacherNotes: string | null
  isAIGenerated: boolean
  course: Course
  class: ClassItem | null
}

function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try { return JSON.parse(s) as T } catch { return fallback }
}

const GROUPING_COLORS: Record<string, string> = {
  individual:    'bg-blue-100 text-blue-700',
  pairs:         'bg-green-100 text-green-700',
  groups:        'bg-purple-100 text-purple-700',
  'whole-class': 'bg-orange-100 text-orange-700',
}

const CURRICULUM_FULL: Record<string, string> = {
  IB: 'International Baccalaureate',
  AP: 'Advanced Placement',
  NATIONAL: 'Türkiye Milli Müfredat (MEB)',
  IGCSE: 'Cambridge IGCSE',
  COMMON_CORE: 'US Common Core',
}

export default function LessonPlanDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [plan, setPlan] = useState<LessonPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [editHomework, setEditHomework] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/teacher/lesson-plans/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setPlan(data.lessonPlan)
          setEditNotes(data.lessonPlan.teacherNotes ?? data.lessonPlan.notes ?? '')
          setEditHomework(data.lessonPlan.homework ?? '')
        } else {
          setError(data.error || 'Ders planı yüklenemedi.')
        }
      })
      .catch(() => setError('Ders planı yüklenemedi.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!plan) return
    if (!confirm('Bu ders planını silmek istediğinize emin misiniz?')) return
    await fetch(`/api/teacher/lesson-plans/${plan.id}`, { method: 'DELETE' })
    router.push('/teacher/lesson-plans')
  }

  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    const res = await fetch(`/api/teacher/lesson-plans/${plan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teacherNotes: editNotes || null,
        notes: editNotes || null,
        homework: editHomework || null,
        wasEdited: true,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setPlan(p => p ? { ...p, teacherNotes: editNotes, notes: editNotes, homework: editHomework } : p)
      setEditing(false)
    }
  }

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-6xl mb-4">📋</div>
        <p className="text-red-600 mb-4">{error || 'Ders planı bulunamadı.'}</p>
        <button onClick={() => router.push('/teacher/lesson-plans')} className="btn-secondary">← Ders Planları</button>
      </div>
    )
  }

  const objectives  = plan.isAIGenerated ? safeJson<string[]>(plan.learningObjectives, []) : (plan.objectives ? plan.objectives.split('\n').filter(Boolean) : [])
  const materials   = plan.isAIGenerated ? safeJson<string[]>(plan.materialsNeeded,    []) : (plan.materials  ? plan.materials.split('\n').filter(Boolean) : [])
  const slides      = safeJson<SlideItem[]>(plan.slideOutline, [])
  const activities  = plan.isAIGenerated ? safeJson<ActivityItem[]>(plan.aiActivities, []) : []
  const assessment  = safeJson<Assessment>(plan.aiAssessment, { formative: [], summative: [], exitTicket: '' })

  const curriculumLabel = plan.curriculumType ? (CURRICULUM_FULL[plan.curriculumType] || plan.curriculumType) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white text-lg">{plan.isAIGenerated ? '🤖' : '📋'}</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{plan.unitName || plan.title}</h1>
                <p className="text-xs text-gray-500 truncate">
                  {plan.course.code}
                  {curriculumLabel && <> · {curriculumLabel}</>}
                  {' · '}{plan.duration} dk
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="btn-secondary text-sm">✏️ Düzenle</button>
              ) : (
                <>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm">İptal</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
                    {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
                  </button>
                </>
              )}
              <button onClick={handlePrint} className="btn-secondary text-sm hidden md:inline-flex">📄 PDF</button>
              <button onClick={handleDelete} className="btn-secondary text-sm text-red-600 hover:text-red-700">🗑️</button>
              <button onClick={() => router.push('/teacher/lesson-plans')} className="text-sm text-gray-500 hover:text-gray-800 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                ←
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Print header */}
      <div className="hidden print:block px-8 pt-8 pb-4 border-b border-gray-300">
        <h1 className="text-2xl font-bold">{plan.unitName || plan.title}</h1>
        <p className="text-sm text-gray-600">
          {plan.course.code} – {plan.course.name}
          {curriculumLabel && <> · {curriculumLabel}</>}
          {plan.class && <> · {plan.class.name}</>}
          {' · '}{plan.duration} dk
          {' · '}{new Date(plan.date).toLocaleDateString('tr-TR')}
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Meta */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-wrap items-center gap-3 text-sm print:hidden">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full font-medium">
            📅 {new Date(plan.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-medium">
            🏫 {plan.course.name}
          </span>
          {plan.class && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full font-medium">
              👥 {plan.class.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full font-medium">
            ⏱ {plan.duration} dakika
          </span>
          {plan.isAIGenerated && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full font-medium">
              🤖 AI Üretildi
            </span>
          )}
        </div>

        {/* Objectives */}
        {objectives.length > 0 && (
          <Section icon="📚" title="Öğrenme Kazanımları" color="blue">
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span className="flex-1">{obj}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Materials */}
        {materials.length > 0 && (
          <Section icon="🛠️" title="Materyaller" color="emerald">
            <div className="flex flex-wrap gap-2">
              {materials.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl font-medium">
                  ✓ {m}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Slides */}
        {slides.length > 0 && (
          <Section icon="📊" title="Ders Akışı (Slayt Planı)" color="violet">
            <div className="space-y-3">
              {slides.map((s, i) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 border-b border-violet-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-violet-600 text-white rounded-lg flex items-center justify-center text-xs font-bold">{s.slide}</span>
                      <span className="font-semibold text-sm text-gray-900">{s.title}</span>
                    </div>
                    <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full font-medium">⏱ {s.duration} dk</span>
                  </div>
                  <div className="px-4 py-3">
                    <ul className="space-y-1">
                      {(s.content || []).map((point, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-violet-400 mt-0.5">→</span>
                          <span className="flex-1">{point}</span>
                        </li>
                      ))}
                    </ul>
                    {s.notes && <p className="mt-2 text-xs text-gray-400 italic">💡 {s.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Activities (AI) */}
        {activities.length > 0 && (
          <Section icon="🎯" title="Aktiviteler" color="orange">
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900 text-sm">{a.name}</span>
                    <span className="text-xs text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-medium">⏱ {a.duration} dk</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${GROUPING_COLORS[a.grouping] || 'bg-gray-100 text-gray-600'}`}>
                      {a.grouping}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{a.description}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Manual activities (non-AI) */}
        {!plan.isAIGenerated && plan.activities && (
          <Section icon="🎯" title="Aktiviteler" color="orange">
            <p className="text-sm text-gray-700 whitespace-pre-line">{plan.activities}</p>
          </Section>
        )}

        {/* Assessment (AI) */}
        {(assessment.formative.length > 0 || assessment.summative.length > 0 || assessment.exitTicket) && (
          <Section icon="✅" title="Değerlendirme" color="green">
            <div className="grid md:grid-cols-2 gap-4">
              {assessment.formative.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Süreç Değerlendirme</p>
                  <ul className="space-y-1.5">
                    {assessment.formative.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 mt-0.5 shrink-0">●</span>
                        <span className="flex-1">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assessment.summative.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sonuç Değerlendirme</p>
                  <ul className="space-y-1.5">
                    {assessment.summative.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-blue-500 mt-0.5 shrink-0">●</span>
                        <span className="flex-1">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {assessment.exitTicket && (
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Çıkış Bileti</p>
                  <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-xl p-3 whitespace-pre-line">{assessment.exitTicket}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Manual assessment */}
        {!plan.isAIGenerated && plan.assessment && (
          <Section icon="✅" title="Değerlendirme" color="green">
            <p className="text-sm text-gray-700 whitespace-pre-line">{plan.assessment}</p>
          </Section>
        )}

        {/* Homework */}
        <Section icon="📚" title="Ödev" color="gray" optional>
          {editing ? (
            <textarea
              className="w-full text-sm bg-gray-50 rounded-xl p-3 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-y min-h-[80px]"
              value={editHomework}
              onChange={e => setEditHomework(e.target.value)}
              placeholder="Ödevi tanımlayın..."
            />
          ) : plan.homework ? (
            <p className="text-sm text-gray-700 whitespace-pre-line">{plan.homework}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Ödev tanımlı değil.</p>
          )}
        </Section>

        {/* Teacher notes */}
        <Section icon="📝" title="Öğretmen Notları" color="gray" optional>
          {editing ? (
            <textarea
              className="w-full text-sm bg-gray-50 rounded-xl p-3 border border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none resize-y min-h-[80px]"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Bu sınıf için kişisel notlar, hatırlatmalar..."
            />
          ) : (plan.teacherNotes || plan.notes) ? (
            <p className="text-sm text-gray-700 whitespace-pre-line">{plan.teacherNotes || plan.notes}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Not tanımlı değil.</p>
          )}
        </Section>

        {/* Bottom actions */}
        <div className="flex flex-wrap gap-3 pt-2 print:hidden">
          <button onClick={handlePrint} className="btn-secondary flex-1 md:flex-none">📄 PDF Aktar</button>
          <button onClick={() => router.push('/teacher/lesson-plans')} className="btn-secondary flex-1 md:flex-none">← Geri</button>
        </div>
      </div>
    </div>
  )
}

function Section({
  icon, title, color, children, optional,
}: { icon: string; title: string; color: string; children: React.ReactNode; optional?: boolean }) {
  const borderColors: Record<string, string> = {
    blue:    'border-l-blue-500',
    emerald: 'border-l-emerald-500',
    violet:  'border-l-violet-500',
    orange:  'border-l-orange-500',
    green:   'border-l-green-500',
    gray:    'border-l-gray-300',
  }
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-gray-300 print:break-inside-avoid">
      <div className={`px-6 py-4 border-l-4 ${borderColors[color] || 'border-l-gray-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{icon}</span>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {optional && <span className="text-xs text-gray-400 font-normal">(opsiyonel)</span>}
        </div>
        {children}
      </div>
    </div>
  )
}
