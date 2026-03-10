'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODE'

interface Question {
  id: string
  type: QuestionType
  content: string
  points: number
  options?: string[]
  correctAnswer?: string
  rubric?: string
}

export default function CreateTestPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [testData, setTestData] = useState({
    title: '',
    subject: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: false,
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: Date.now().toString(),
    type: 'MULTIPLE_CHOICE',
    content: '',
    points: 1,
    options: ['', '', '', ''],
    correctAnswer: '',
  })

  const addQuestion = () => {
    if (!currentQuestion.content) {
      alert('Please enter question content!')
      return
    }
    
    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({
      id: Date.now().toString(),
      type: 'MULTIPLE_CHOICE',
      content: '',
      points: 1,
      options: ['', '', '', ''],
      correctAnswer: '',
    })
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSubmit = async () => {
    if (!testData.title) {
      alert('Please enter test title!')
      return
    }
    
    if (questions.length === 0) {
      alert('Please add at least one question!')
      return
    }

    const submitData = {
      ...testData,
      startDate: testData.startDate || null,
      endDate: testData.endDate || null,
    }

    try {
      const response = await fetch('/api/tests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitData,
          questions,
        }),
      })

      if (response.ok) {
        alert('Test created successfully!')
        router.push('/teacher/tests')
      } else {
        alert('Error occurred!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Create New Test</h1>
            <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary">
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
                placeholder="e.g., Math Unit 1 Test"
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
                placeholder="e.g., Math, Physics, Chemistry..."
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
                placeholder="Brief description of the test..."
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
                Activate test immediately (Students can start taking it)
              </label>
            </div>
          </div>
        </div>

        {/* Add Question Form */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Add New Question</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Type
              </label>
              <select
                className="input-field"
                value={currentQuestion.type}
                onChange={(e) => setCurrentQuestion({ 
                  ...currentQuestion, 
                  type: e.target.value as QuestionType,
                  options: e.target.value === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : undefined,
                })}
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="ESSAY">Essay</option>
                <option value="CODE">Code</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Content *
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={currentQuestion.content}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, content: e.target.value })}
                placeholder="Write your question here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points
              </label>
              <input
                type="number"
                min="1"
                className="input-field"
                value={currentQuestion.points}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
              />
            </div>

            {/* Multiple Choice Options */}
            {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  {currentQuestion.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      className="input-field mb-2"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(currentQuestion.options || [])]
                        newOptions[index] = e.target.value
                        setCurrentQuestion({ ...currentQuestion, options: newOptions })
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select
                    className="input-field"
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {currentQuestion.options.map((option, index) => (
                      <option key={index} value={option}>{option || `Option ${index + 1}`}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Answer key for other types */}
            {currentQuestion.type !== 'MULTIPLE_CHOICE' && currentQuestion.type !== 'ESSAY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer / Answer Key
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={currentQuestion.correctAnswer || ''}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                  placeholder="Write the correct answer here..."
                />
              </div>
            )}

            {/* Rubric for essay */}
            {currentQuestion.type === 'ESSAY' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grading Criteria (Rubric)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={currentQuestion.rubric || ''}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, rubric: e.target.value })}
                  placeholder="e.g., Clear thesis? Sufficient evidence? Correct grammar?"
                />
              </div>
            )}

            <button onClick={addQuestion} className="btn-primary w-full">
              + Add Question
            </button>
          </div>
        </div>

        {/* Added Questions List */}
        {questions.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-xl font-bold mb-4">Added Questions ({questions.length})</h2>
            
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold">Question {index + 1}</span>
                      <span className="ml-2 text-sm text-gray-500">({q.type})</span>
                      <span className="ml-2 text-sm font-semibold text-primary-600">{q.points} points</span>
                    </div>
                    <button 
                      onClick={() => removeQuestion(q.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700">{q.content}</p>
                  {q.options && (
                    <div className="mt-2 text-sm text-gray-600">
                      Correct answer: <span className="font-semibold">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-4">
          <button onClick={handleSubmit} className="btn-primary flex-1">
            Save and Publish Test
          </button>
          <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
