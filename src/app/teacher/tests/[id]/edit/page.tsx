'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODE'

interface Question {
  id: string
  type: QuestionType
  content: string
  points: number
  options?: string[]
  correctAnswer?: string
  rubric?: string
  orderIndex: number
  isEditing?: boolean
}

export default function EditTestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [testData, setTestData] = useState({
    title: '',
    subject: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: false,
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTest()
  }, [testId])

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}`)
      const data = await response.json()
      
      if (data.success) {
        const test = data.test
        setTestData({
          title: test.title,
          subject: test.subject || '',
          description: test.description || '',
          startDate: test.startDate ? new Date(test.startDate).toISOString().slice(0, 16) : '',
          endDate: test.endDate ? new Date(test.endDate).toISOString().slice(0, 16) : '',
          isActive: test.isActive || false,
        })
        setQuestions(test.questions.sort((a: any, b: any) => a.orderIndex - b.orderIndex))
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEdit = (id: string) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, isEditing: !q.isEditing } : q
    ))
  }

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ))
  }

  const deleteQuestion = (id: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const addNewQuestion = () => {
    const newQuestion: Question = {
      id: `new_${Date.now()}`,
      type: 'MULTIPLE_CHOICE',
      content: '',
      points: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
      orderIndex: questions.length,
      isEditing: true,
    }
    setQuestions([...questions, newQuestion])
  }

  const handleSubmit = async () => {
    if (!testData.title) {
      alert('Please enter test title!')
      return
    }

    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testData.title,
          subject: testData.subject,
          description: testData.description,
          startDate: testData.startDate || null,
          endDate: testData.endDate || null,
          isActive: testData.isActive,
          questions: questions.map((q, index) => ({
            type: q.type,
            content: q.content,
            points: q.points,
            options: q.options,
            correctAnswer: q.correctAnswer,
            rubric: q.rubric,
            orderIndex: index,
          })),
        }),
      })

      if (response.ok) {
        alert('Test updated successfully!')
        router.push('/teacher/tests')
      } else {
        alert('Error occurred!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Edit Test</h1>
            <button onClick={() => router.push('/teacher/tests')} className="btn-secondary">
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Test Information */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Test Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title *
              </label>
              <input
                type="text"
                className="input-field"
                value={testData.title}
                onChange={(e) => setTestData({ ...testData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                className="input-field"
                value={testData.subject}
                onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={testData.description}
                onChange={(e) => setTestData({ ...testData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date and Time
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={testData.startDate}
                  onChange={(e) => setTestData({ ...testData, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date and Time
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={testData.endDate}
                  onChange={(e) => setTestData({ ...testData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={testData.isActive}
                onChange={(e) => setTestData({ ...testData, isActive: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Test active (Students can take it)
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Questions ({questions.length})</h2>
            <button onClick={addNewQuestion} className="btn-primary">
              + Add Question
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-semibold">Question {index + 1}</span>
                    <span className="ml-2 text-sm text-gray-500">({q.type})</span>
                    <span className="ml-2 text-sm font-semibold text-primary-600">{q.points} pts</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleEdit(q.id)}
                      className="text-primary-600 hover:text-primary-800 text-sm"
                    >
                      {q.isEditing ? 'Save' : 'Edit'}
                    </button>
                    <button 
                      onClick={() => deleteQuestion(q.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {q.isEditing ? (
                  <div className="space-y-3">
                    <select
                      className="input-field"
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="ESSAY">Essay</option>
                      <option value="CODE">Code</option>
                    </select>

                    <textarea
                      className="input-field"
                      rows={2}
                      value={q.content}
                      onChange={(e) => updateQuestion(q.id, 'content', e.target.value)}
                      placeholder="Question content..."
                    />

                    <input
                      type="number"
                      className="input-field"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value))}
                      placeholder="Points"
                    />

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <>
                        {q.options?.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            className="input-field"
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(q.options || [])]
                              newOptions[idx] = e.target.value
                              updateQuestion(q.id, 'options', newOptions)
                            }}
                            placeholder={`Option ${idx + 1}`}
                          />
                        ))}
                        <select
                          className="input-field"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                        >
                          <option value="">Select correct answer...</option>
                          {q.options?.map((opt, idx) => (
                            <option key={idx} value={opt}>{opt || `Option ${idx + 1}`}</option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 whitespace-pre-wrap">{q.content}</p>
                    {q.options && (
                      <div className="mt-2 text-sm text-gray-600">
                        Correct: <span className="font-semibold">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button onClick={handleSubmit} className="btn-primary flex-1">
            Save Changes
          </button>
          <button onClick={() => router.push('/teacher/tests')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
