'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Answer {
  id: string
  response: string
  aiScore: number | null
  aiFeedback: string | null
  aiConfidence: number | null
  teacherScore: number | null
  teacherFeedback: string | null
  question: {
    content: string
    points: number
    type: string
  }
}

interface Submission {
  id: string
  status: string
  totalScore: number | null
  maxScore: number | null
  submittedAt: string | null
  answers: Answer[]
  test: {
    title: string
    subject: string | null
  }
}

export default function StudentResultsPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchResults()
  }, [submissionId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/student/results/${submissionId}`)
      const data = await response.json()
      
      if (data.success) {
        setSubmission(data.submission)
      } else {
        alert(data.error || 'Failed to load results')
        router.push('/student/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load results')
      router.push('/student/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!submission) {
    return <div className="min-h-screen flex items-center justify-center">Results not found</div>
  }

  const percentage = submission.maxScore 
    ? Math.round((submission.totalScore! / submission.maxScore) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">Test Results</h1>
            <button onClick={() => router.push('/student/dashboard')} className="btn-secondary">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Score Card */}
        <div className="card mb-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">{submission.test.title}</h2>
          {submission.test.subject && (
            <span className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full mb-4">
              {submission.test.subject}
            </span>
          )}
          
          <div className="my-8">
            <div className="text-6xl font-bold text-primary-600 mb-2">
              {submission.totalScore}/{submission.maxScore}
            </div>
            <div className="text-2xl text-gray-600">
              {percentage}%
            </div>
          </div>

          <div className={`
            inline-block px-6 py-2 rounded-full text-lg font-semibold
            ${percentage >= 90 ? 'bg-green-100 text-green-800' : ''}
            ${percentage >= 70 && percentage < 90 ? 'bg-blue-100 text-blue-800' : ''}
            ${percentage >= 60 && percentage < 70 ? 'bg-yellow-100 text-yellow-800' : ''}
            ${percentage < 60 ? 'bg-red-100 text-red-800' : ''}
          `}>
            {percentage >= 90 ? '🌟 Excellent!' : ''}
            {percentage >= 70 && percentage < 90 ? '👍 Good Job!' : ''}
            {percentage >= 60 && percentage < 70 ? '📚 Keep Studying' : ''}
            {percentage < 60 ? '💪 Need More Practice' : ''}
          </div>

          {submission.submittedAt && (
            <p className="text-sm text-gray-500 mt-4">
              Submitted: {new Date(submission.submittedAt).toLocaleString('en-US')}
            </p>
          )}
        </div>

        {/* Question by Question Results */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Question-by-Question Breakdown</h2>

          <div className="space-y-6">
            {submission.answers.map((answer, idx) => {
              // Use teacher score if available, otherwise AI score
              const finalScore = answer.teacherScore !== null ? answer.teacherScore : (answer.aiScore || 0)
              const finalFeedback = answer.teacherFeedback || answer.aiFeedback
              const isTeacherGraded = answer.teacherScore !== null

              return (
                <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-semibold text-gray-900">Question {idx + 1}</span>
                      <span className="ml-2 text-sm text-gray-500">({answer.question.type})</span>
                    </div>
                    <div className="text-right">
                      <div className={`
                        text-lg font-bold
                        ${finalScore === answer.question.points ? 'text-green-600' : ''}
                        ${finalScore > 0 && finalScore < answer.question.points ? 'text-yellow-600' : ''}
                        ${finalScore === 0 ? 'text-red-600' : ''}
                      `}>
                        {finalScore}/{answer.question.points}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isTeacherGraded ? '👨‍🏫 Teacher' : '🤖 AI'}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{answer.question.content}</p>

                  <div className="bg-gray-50 p-3 rounded mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Your Answer:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{answer.response || 'No answer'}</p>
                  </div>

                  {finalFeedback && (
                    <div className={`
                      p-3 rounded border
                      ${finalScore === answer.question.points 
                        ? 'bg-green-50 border-green-200' 
                        : finalScore > 0 
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                      }
                    `}>
                      <p className="text-sm font-medium mb-1">
                        {finalScore === answer.question.points ? '✅ ' : ''}
                        {finalScore > 0 && finalScore < answer.question.points ? '⚠️ ' : ''}
                        {finalScore === 0 ? '❌ ' : ''}
                        {isTeacherGraded ? 'Teacher Feedback:' : 'AI Feedback:'}
                      </p>
                      <p className="text-sm">{finalFeedback}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
