'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Assignment {
  id: string
  weeklyHours: number
  isScheduled: boolean
  course: {
    id: string
    code: string
    name: string
  }
  teacher: {
    id: string
    name: string
  }
  class: {
    id: string
    name: string
  } | null
}

interface Course {
  id: string
  code: string
  name: string
  weeklyHours: number
}

interface Teacher {
  id: string
  name: string
  subject: string | null
}

interface Class {
  id: string
  name: string
}

interface SuggestedSlot {
  dayOfWeek: number
  startTime: string
  endTime: string
  reason: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function CourseAssignmentsPage() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    courseId: '',
    teacherId: '',
    classId: '',
    weeklyHours: '4'
  })
  const [error, setError] = useState('')
  
  // AI Schedule Generation
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null)
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([])
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set())
  const [showSchedulePreview, setShowSchedulePreview] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [assignmentsRes, coursesRes, teachersRes, classesRes] = await Promise.all([
        fetch('/api/admin/course-assignments'),
        fetch('/api/admin/courses'),
        fetch('/api/admin/teachers'),
        fetch('/api/admin/classes')
      ])

      const assignmentsData = await assignmentsRes.json()
      const coursesData = await coursesRes.json()
      const teachersData = await teachersRes.json()
      const classesData = await classesRes.json()

      if (assignmentsData.success) setAssignments(assignmentsData.assignments)
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
      const response = await fetch('/api/admin/course-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create assignment')
        return
      }

      setShowForm(false)
      setFormData({ courseId: '', teacherId: '', classId: '', weeklyHours: '4' })
      fetchData()
    } catch (error) {
      setError('Something went wrong')
    }
  }

  const handleGenerateSchedule = async (assignment: Assignment) => {
    setGeneratingFor(assignment.id)
    setCurrentAssignment(assignment)
    setSuggestedSlots([])
    setSelectedSlots(new Set())
    setError('')

    try {
      const response = await fetch('/api/admin/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId: assignment.id })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate schedule')
        setGeneratingFor(null)
        return
      }

      setSuggestedSlots(data.suggestedSlots)
      setShowSchedulePreview(true)
      setGeneratingFor(null)

    } catch (error) {
      setError('Failed to generate schedule')
      setGeneratingFor(null)
    }
  }

  const handleApproveSchedule = async () => {
    if (selectedSlots.size === 0) {
      alert('Please select at least one time slot')
      return
    }

    if (!currentAssignment) return

    try {
      // Create schedules for selected slots
      const promises = Array.from(selectedSlots).map(async (index) => {
        const slot = suggestedSlots[index]
        return fetch('/api/admin/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: currentAssignment.course.id,
            teacherId: currentAssignment.teacher.id,
            classId: currentAssignment.class?.id || null,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: null
          })
        })
      })

      await Promise.all(promises)

      // Mark assignment as scheduled
      setShowSchedulePreview(false)
      setSuggestedSlots([])
      setSelectedSlots(new Set())
      setCurrentAssignment(null)
      fetchData()

      alert('Schedule created successfully!')

    } catch (error) {
      alert('Failed to create schedule')
    }
  }

  const toggleSlot = (index: number) => {
    const newSelected = new Set(selectedSlots)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedSlots(newSelected)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Assignments</h1>
            <p className="text-gray-600 mt-1">Assign courses to teachers and generate schedules with AI</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="btn-secondary"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              ➕ New Assignment
            </button>
          </div>
        </div>

        {/* Create Assignment Form */}
        {showForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Course Assignment</h2>
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
                    onChange={(e) => {
                      const courseId = e.target.value
                      const selectedCourse = courses.find(c => c.id === courseId)
                      setFormData({ 
                        ...formData, 
                        courseId,
                        weeklyHours: selectedCourse?.weeklyHours ? String(selectedCourse.weeklyHours) : '4'
                      })
                    }}
                  >
                    <option value="">Select course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name} ({course.weeklyHours}h/week)
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
                        {teacher.name}{teacher.subject ? ` (${teacher.subject})` : ''}
                      </option>
                    ))}
                  </select>
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
                    <option value="">All classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Hours *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    className="input-field"
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled from course, can be adjusted</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" className="btn-primary">
                  Create Assignment
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

        {/* AI Schedule Preview */}
        {showSchedulePreview && suggestedSlots.length > 0 && (
          <div className="card mb-6 border-2 border-primary-500">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h2 className="text-xl font-bold text-gray-900">AI Generated Schedule</h2>
            </div>
            <p className="text-gray-600 mb-4">Select the time slots you want to use:</p>

            <div className="space-y-3 mb-4">
              {suggestedSlots.map((slot, index) => (
                <div
                  key={index}
                  onClick={() => toggleSlot(index)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSlots.has(index)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSlots.has(index)}
                      onChange={() => toggleSlot(index)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {DAYS[slot.dayOfWeek]} • {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-sm text-gray-600">{slot.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApproveSchedule}
                disabled={selectedSlots.size === 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ Approve & Create Schedule ({selectedSlots.size} slots)
              </button>
              <button
                onClick={() => setShowSchedulePreview(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Assignments List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">All Assignments ({assignments.length})</h2>
          
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 mb-4">No course assignments yet</p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create First Assignment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {assignment.course.code} - {assignment.course.name}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        👤 {assignment.teacher.name}
                        {assignment.class && ` • 🎓 ${assignment.class.name}`}
                        {` • ⏰ ${assignment.weeklyHours}h/week`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {assignment.isScheduled ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          Scheduled ✅
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGenerateSchedule(assignment)}
                          disabled={generatingFor === assignment.id}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {generatingFor === assignment.id ? (
                            <>🤖 Generating...</>
                          ) : (
                            <>🤖 Generate Schedule</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}