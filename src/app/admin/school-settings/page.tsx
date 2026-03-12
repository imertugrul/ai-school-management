'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SchoolSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    schoolStartTime: '08:00',
    schoolEndTime: '16:00',
    lessonDuration: '45',
    breakDuration: '10',
    lunchBreakStart: '12:00',
    lunchBreakEnd: '13:00'
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/school-settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings({
          schoolStartTime: data.settings.schoolStartTime || '08:00',
          schoolEndTime: data.settings.schoolEndTime || '16:00',
          lessonDuration: String(data.settings.lessonDuration || 45),
          breakDuration: String(data.settings.breakDuration || 10),
          lunchBreakStart: data.settings.lunchBreakStart || '12:00',
          lunchBreakEnd: data.settings.lunchBreakEnd || '13:00'
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/school-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setMessage('Settings saved successfully! ✅')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings ❌')
      }
    } catch (error) {
      setMessage('Something went wrong ❌')
    } finally {
      setSaving(false)
    }
  }

  // Calculate total lessons per day
  const calculateLessonsPerDay = () => {
    const start = parseInt(settings.schoolStartTime.split(':')[0])
    const end = parseInt(settings.schoolEndTime.split(':')[0])
    const lunchStart = parseInt(settings.lunchBreakStart.split(':')[0])
    const lunchEnd = parseInt(settings.lunchBreakEnd.split(':')[0])
    
    const totalMinutes = (end - start) * 60 - (lunchEnd - lunchStart) * 60
    const lessonWithBreak = parseInt(settings.lessonDuration) + parseInt(settings.breakDuration)
    
    return Math.floor(totalMinutes / lessonWithBreak)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">School Schedule Settings</h1>
            <p className="text-gray-600 mt-1">Configure your school's daily schedule</p>
          </div>
          <button
            onClick={() => router.push('/admin')}
            className="btn-secondary"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSave} className="card">
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* School Hours */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">School Hours</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Start Time
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={settings.schoolStartTime}
                    onChange={(e) => setSettings({ ...settings, schoolStartTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School End Time
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={settings.schoolEndTime}
                    onChange={(e) => setSettings({ ...settings, schoolEndTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Lesson Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Settings</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lesson Duration (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min="30"
                    max="90"
                    className="input-field"
                    value={settings.lessonDuration}
                    onChange={(e) => setSettings({ ...settings, lessonDuration: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 40-50 minutes</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min="5"
                    max="30"
                    className="input-field"
                    value={settings.breakDuration}
                    onChange={(e) => setSettings({ ...settings, breakDuration: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Between lessons</p>
                </div>
              </div>
            </div>

            {/* Lunch Break */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lunch Break</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lunch Start Time
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={settings.lunchBreakStart}
                    onChange={(e) => setSettings({ ...settings, lunchBreakStart: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lunch End Time
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={settings.lunchBreakEnd}
                    onChange={(e) => setSettings({ ...settings, lunchBreakEnd: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Daily Schedule Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• School hours: {settings.schoolStartTime} - {settings.schoolEndTime}</p>
                <p>• Lesson duration: {settings.lessonDuration} minutes</p>
                <p>• Break duration: {settings.breakDuration} minutes</p>
                <p>• Lunch break: {settings.lunchBreakStart} - {settings.lunchBreakEnd}</p>
                <p className="font-semibold mt-2">
                  ✨ Maximum lessons per day: {calculateLessonsPerDay()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
