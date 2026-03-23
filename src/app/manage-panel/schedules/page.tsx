'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  course: {
    code: string
    name: string
  }
  teacher: {
    name: string
  }
  class: {
    name: string
  } | null
}

interface Course {
  id: string
  code: string
  name: string
}

interface Teacher {
  id: string
  name: string
  email: string
}

interface Class {
  id: string
  name: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AdminSchedulesPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    classId: '',
    dayOfWeek: '0',
    startTime: '09:00',
    endTime: '10:00',
    room: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [schedulesRes, coursesRes, teachersRes, classesRes] = await Promise.all([
        fetch('/api/admin/schedules'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/classes')
      ])

      const schedulesData = await schedulesRes.json()
      const coursesData = await coursesRes.json()
      const teachersData = await teachersRes.json()
      const classesData = await classesRes.json()

      if (schedulesData.success) setSchedules(schedulesData.schedules)
      if (coursesData.success) setCourses(coursesData.courses)
      if (teachersData.success) setTeachers(teachersData.teachers)
      if (classesData.success) setClasses(classesData.classes)

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create schedule')
        return
      }

      setShowForm(false)
      setFormData({
        courseId: '',
        teacherId: '',
        classId: '',
        dayOfWeek: '0',
        startTime: '09:00',
        endTime: '10:00',
        room: ''
      })
      fetchData()
    } catch (error) {
      setError('Something went wrong')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedules...</p>
        </div>
      </div>
    )
  }

  // Group schedules by day
  const schedulesByDay = DAYS.map((day, index) => ({
    day,
    schedules: schedules.filter(s => s.dayOfWeek === index).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
            <p className="text-gray-600 mt-1">Create and manage class schedules</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/manage-panel')}
              className="btn-secondary"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              ➕ Add Schedule
            </button>
          </div>
        </div>

        {/* Create Schedule Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Schedule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  >
                    <option value="">Select course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  >
                    <option value="">Select teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day *
                  </label>
                  <select
                    required
                    className="input-field"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  >
                    {DAYS.map((day, index) => (
                      <option key={index} value={index}>{day}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class (Optional)
                  </label>
                  <select
                    className="input-field"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  >
                    <option value="">No specific class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., Room 101"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Create Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Weekly Schedule View */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Schedule</h2>
          
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <p className="text-gray-500 mb-4">No schedules yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create First Schedule
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {schedulesByDay.map(({ day, schedules }) => (
                <div key={day}>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">{day}</h3>
                  {schedules.length === 0 ? (
                    <p className="text-gray-400 text-sm ml-4">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {schedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="border-l-4 border-primary-500 bg-primary-50 p-4 rounded-r-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {schedule.course.code} - {schedule.course.name}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                👤 {schedule.teacher.name}
                                {schedule.class && ` • 🎓 ${schedule.class.name}`}
                                {schedule.room && ` • 🚪 ${schedule.room}`}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-primary-600">
                              {schedule.startTime} - {schedule.endTime}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
