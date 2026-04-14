'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Class {
  id: string
  name: string
  _count: {
    students: number
  }
}

export default function TestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const testId = params.id as string

  const [test, setTest] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [testId])

  const fetchData = async () => {
    try {
      const testRes = await fetch(`/api/tests/${testId}`)
      const testData = await testRes.json()

      const classesRes = await fetch('/api/teacher/classes')
      const classesData = await classesRes.json()

      if (testData.success) setTest(testData.test)
      if (classesData.success) setClasses(classesData.classes)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignToClass = async () => {
    if (!selectedClass) {
      alert(t('dashboard.teacher.selectClassLabel'))
      return
    }

    setAssigning(true)

    try {
      const response = await fetch(`/api/tests/${testId}/assign-class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`${data.assignedCount} ${t('dashboard.teacher.students')}`)
        setSelectedClass('')
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('dashboard.teacher.loading')}</div>
  }

  if (!test) {
    return <div className="min-h-screen flex items-center justify-center">{t('dashboard.teacher.testNotFound')}</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">{test.title}</h1>
            <button
              onClick={() => router.push('/teacher/tests')}
              className="btn-secondary"
            >
              {t('dashboard.teacher.back')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.teacher.testInfoTitle')}</h2>
          <div className="space-y-2 text-gray-700">
            <p><strong>{t('dashboard.teacher.testDetailTitleLabel')}</strong> {test.title}</p>
            {test.subject && <p><strong>{t('dashboard.teacher.testDetailSubjectLabel')}</strong> {test.subject}</p>}
            {test.description && <p><strong>{t('dashboard.teacher.testDetailDescLabel')}</strong> {test.description}</p>}
            <p><strong>{t('dashboard.teacher.testDetailQuestionsLabel')}</strong> {test.questions?.length || 0}</p>
            <p><strong>{t('dashboard.teacher.testDetailStatusLabel')}</strong> {test.isActive ? t('dashboard.teacher.testDetailActiveText') : t('dashboard.teacher.testDetailInactiveText')}</p>
            <p><strong>{t('dashboard.teacher.testDetailCodeLabel')}</strong> <code className="bg-gray-100 px-2 py-1 rounded">{test.accessCode}</code></p>
          </div>
        </div>

        {/* Assign to Class */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">{t('dashboard.teacher.assignToClassTitle')}</h2>
          <p className="text-gray-600 mb-4">
            {t('dashboard.teacher.assignToClassDesc')}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard.teacher.selectClassLabel')}
              </label>
              <select
                className="input-field"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={assigning}
              >
                <option value="">{t('dashboard.teacher.selectClassPlaceholder')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls._count.students} {t('dashboard.teacher.students')})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignToClass}
              disabled={assigning || !selectedClass}
              className="btn-primary w-full disabled:opacity-50"
            >
              {assigning ? t('dashboard.teacher.assignBtnProgress') : t('dashboard.teacher.assignBtn')}
            </button>
          </div>

          {classes.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                {t('dashboard.teacher.assignNoClassesWarning')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
