'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface GradeComponent {
  id: string
  name: string
  type: string
  weight: number
  maxScore: number
  date: string | null
  testId: string | null
}

interface Student {
  id: string
  name: string
  email: string
}

interface Course {
  id: string
  code: string
  name: string
  class: { id: string; name: string } | null
}

interface AvailableTest {
  id: string
  title: string
  subject: string | null
  category: string
  endedAt: string | null
  _count: { submissions: number; questions: number }
}

const TYPE_COLORS: Record<string, string> = {
  EXAM: 'bg-red-100 text-red-800',
  QUIZ: 'bg-blue-100 text-blue-800',
  HOMEWORK: 'bg-yellow-100 text-yellow-800',
  ASSIGNMENT: 'bg-orange-100 text-orange-800',
  PROJECT: 'bg-purple-100 text-purple-800',
  PARTICIPATION: 'bg-green-100 text-green-800',
}

const CATEGORY_TO_TYPE: Record<string, string> = {
  EXAM: 'EXAM',
  QUIZ: 'QUIZ',
  HOMEWORK: 'HOMEWORK',
  ASSIGNMENT: 'ASSIGNMENT',
  PROJECT: 'PROJECT',
  PARTICIPATION: 'PARTICIPATION',
}

export default function CourseGradeBookPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [components, setComponents] = useState<GradeComponent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  const [showComponentForm, setShowComponentForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'EXAM', weight: '30', maxScore: '100', date: '' })

  const [showTestModal, setShowTestModal] = useState(false)
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([])
  const [testsLoading, setTestsLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState<AvailableTest | null>(null)
  const [testWeight, setTestWeight] = useState('30')
  const [testType, setTestType] = useState('EXAM')
  const [testName, setTestName] = useState('')
  const [addingTest, setAddingTest] = useState(false)
  const [addTestResult, setAddTestResult] = useState<string | null>(null)

  useEffect(() => { fetchCourseData() }, [courseId])

  const fetchCourseData = async () => {
    try {
      const [courseRes, componentsRes, studentsRes] = await Promise.all([
        fetch(`/api/teacher/courses/${courseId}`),
        fetch(`/api/teacher/courses/${courseId}/components`),
        fetch(`/api/teacher/courses/${courseId}/students`),
      ])
      const courseData = await courseRes.json()
      const componentsData = await componentsRes.json()
      const studentsData = await studentsRes.json()
      if (courseData.success) setCourse(courseData.course)
      if (componentsData.success) setComponents(componentsData.components)
      if (studentsData.success) setStudents(studentsData.students)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/teacher/courses/${courseId}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, weight: parseFloat(formData.weight) / 100, maxScore: parseFloat(formData.maxScore) }),
      })
      if (response.ok) {
        setShowComponentForm(false)
        setFormData({ name: '', type: 'EXAM', weight: '30', maxScore: '100', date: '' })
        fetchCourseData()
      }
    } catch (error) { console.error('Error:', error) }
  }

  const openTestModal = async () => {
    setShowTestModal(true)
    setSelectedTest(null)
    setAddTestResult(null)
    setTestsLoading(true)
    try {
      const res = await fetch(`/api/teacher/gradebook/${courseId}/available-tests`)
      const data = await res.json()
      if (data.success) setAvailableTests(data.tests)
    } catch { /* ignore */ }
    finally { setTestsLoading(false) }
  }

  const handleSelectTest = (test: AvailableTest) => {
    setSelectedTest(test)
    setTestName(test.title)
    setTestType(CATEGORY_TO_TYPE[test.category] ?? 'EXAM')
  }

  const handleAddTest = async () => {
    if (!selectedTest) return
    setAddingTest(true)
    setAddTestResult(null)
    try {
      const res = await fetch(`/api/teacher/gradebook/${courseId}/add-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: selectedTest.id, name: testName, weight: testWeight, type: testType }),
      })
      const data = await res.json()
      if (data.success) {
        setAddTestResult(`✅ "${testName}" eklendi — ${data.filledCount} öğrenci notu otomatik dolduruldu.`)
        fetchCourseData()
        setAvailableTests(prev => prev.filter(test => test.id !== selectedTest.id))
        setSelectedTest(null)
      } else {
        setAddTestResult(`❌ Hata: ${data.error}`)
      }
    } catch { setAddTestResult('❌ Bağlantı hatası') }
    finally { setAddingTest(false) }
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('dashboard.teacher.loading')}</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.teacher.gbCourseNotFound')}</h3>
          <button onClick={() => router.push('/teacher/gradebook')} className="btn-primary mt-4">{t('dashboard.teacher.gbBackToCourses')}</button>
        </div>
      </div>
    )
  }

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">{course.code.slice(0, 2)}</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{course.code}</h1>
                <p className="text-xs text-gray-500">{course.name}</p>
              </div>
              {course.class && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  {course.class.name}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/teacher/gradebook')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              {t('dashboard.teacher.gbBackToCourses')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Grade Components */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('dashboard.teacher.gbComponents')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('dashboard.teacher.gbTotalWeight')} <span className="font-semibold">{(totalWeight * 100).toFixed(0)}%</span>
                {Math.abs(totalWeight - 1) > 0.01 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {t('dashboard.teacher.gbShouldEqual100')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={openTestModal} className="btn-secondary text-sm">
                {t('dashboard.teacher.gbAddTest')}
              </button>
              <button onClick={() => setShowComponentForm(true)} className="btn-primary text-sm">
                {t('dashboard.teacher.gbAddComponent')}
              </button>
            </div>
          </div>

          {showComponentForm && (
            <form onSubmit={handleCreateComponent} className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
              <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.teacher.gbNewComponentTitle')}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.gbFormNameLabel')}</label>
                  <input type="text" required className="input-field" placeholder={t('dashboard.teacher.gbFormPlaceholder')}
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.gbFormTypeLabel')}</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option value="EXAM">Exam</option>
                    <option value="QUIZ">Quiz</option>
                    <option value="HOMEWORK">Homework</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="PROJECT">Project</option>
                    <option value="PARTICIPATION">Participation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.gbFormWeightLabel')}</label>
                  <input type="number" required min="0" max="100" className="input-field" placeholder="30"
                    value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.gbFormMaxScoreLabel')}</label>
                  <input type="number" required min="0" className="input-field" placeholder="100"
                    value={formData.maxScore} onChange={e => setFormData({ ...formData, maxScore: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.gbFormDateLabel')}</label>
                  <input type="date" className="input-field" value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="btn-primary text-sm">{t('dashboard.teacher.gbFormCreate')}</button>
                <button type="button" onClick={() => setShowComponentForm(false)} className="btn-secondary text-sm">{t('dashboard.common.cancel')}</button>
              </div>
            </form>
          )}

          {components.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.teacher.gbNoComponents')}</h3>
              <p className="text-gray-500 text-sm">{t('dashboard.teacher.gbNoComponentsDesc')}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColName')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColType')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColWeight')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColMaxScore')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColDate')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColSource')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {components.map((component) => (
                    <tr key={component.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">{component.name}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[component.type] || 'bg-gray-100 text-gray-700'}`}>
                          {component.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{(component.weight * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{component.maxScore}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {component.date ? new Date(component.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {component.testId ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            🧪 Test
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="card">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              {t('dashboard.teacher.gbStudentsTitle')} <span className="text-sm font-normal text-gray-400">({students.length})</span>
            </h2>
            {components.length > 0 && (
              <button onClick={() => router.push(`/teacher/gradebook/${courseId}/enter-grades`)} className="btn-primary text-sm">
                {t('dashboard.teacher.gbEnterGrades')}
              </button>
            )}
          </div>

          {students.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.teacher.gbNoStudents')}</h3>
              <p className="text-gray-500 text-sm">{t('dashboard.teacher.gbNoStudentsDesc')}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColName')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColEmail')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">{t('dashboard.teacher.gbColCurrentGrade')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-semibold">{getInitials(student.name)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">—</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{t('dashboard.teacher.gbTestModalTitle')}</h2>
              <button onClick={() => { setShowTestModal(false); setAddTestResult(null) }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-4">
              {addTestResult && (
                <div className={`p-3 rounded-xl text-sm font-medium ${addTestResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                  {addTestResult}
                </div>
              )}

              {testsLoading ? (
                <div className="text-center py-8 text-gray-500">{t('dashboard.teacher.loading')}</div>
              ) : availableTests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-5xl mb-3">🧪</p>
                  <p className="text-gray-500 font-medium">{t('dashboard.teacher.gbNoAvailableTests')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('dashboard.teacher.gbNoAvailableTestsDesc')}</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('dashboard.teacher.gbTestSelectLabel')}</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {availableTests.map(test => (
                        <button
                          key={test.id}
                          onClick={() => handleSelectTest(test)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            selectedTest?.id === test.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">{test.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {test.subject && `${test.subject} · `}
                            {test._count.questions} {t('dashboard.teacher.questions')} · {test._count.submissions} {t('dashboard.teacher.gbSubmissionsShort')}
                            {test.endedAt && ` · ${new Date(test.endedAt).toLocaleDateString('tr-TR')}`}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedTest && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('dashboard.teacher.gbComponentName')}</label>
                        <input
                          type="text"
                          className="input-field"
                          value={testName}
                          onChange={e => setTestName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('dashboard.teacher.gbTestTypeLabel')}</label>
                          <select className="input-field" value={testType} onChange={e => setTestType(e.target.value)}>
                            <option value="EXAM">Exam</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="HOMEWORK">Homework</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="PROJECT">Project</option>
                            <option value="PARTICIPATION">Participation</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('dashboard.teacher.gbTestWeightLabel')}</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input-field"
                            value={testWeight}
                            onChange={e => setTestWeight(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleAddTest}
                        disabled={addingTest || !testName.trim()}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
                      >
                        {addingTest ? t('dashboard.teacher.gbAdding') : t('dashboard.teacher.gbAddAndFill')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
