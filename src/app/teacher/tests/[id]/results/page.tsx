'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

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
  student: {
    name: string
    email: string
  }
  answers: Answer[]
}

export default function TestResultsPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useLanguage()
  const testId = params.id as string

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState<string | null>(null)
  const [releasing, setReleasing] = useState<string | null>(null)
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null)
  const [editScore, setEditScore] = useState<number>(0)
  const [editFeedback, setEditFeedback] = useState<string>('')

  useEffect(() => {
    fetchResults()
  }, [testId])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/results`)
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.submissions)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeWithAI = async (submissionId: string) => {
    if (!confirm(t('dashboard.teacher.gradeWithAI') + '?')) return

    setGrading(submissionId)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        alert(`${t('dashboard.teacher.averageScoreLabel')}: ${data.totalScore}/${data.maxScore}`)
        fetchResults()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGrading(null)
    }
  }

  const handleRelease = async (submissionId: string) => {
    if (!confirm(t('dashboard.teacher.releaseResultsBtn') + '?')) return

    setReleasing(submissionId)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/release`, {
        method: 'POST'
      })
      const data = await response.json()

      if (data.success) {
        fetchResults()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setReleasing(null)
    }
  }

  const handleEditAnswer = async (answerId: string) => {
    try {
      const response = await fetch(`/api/answers/${answerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherScore: editScore,
          teacherFeedback: editFeedback
        })
      })

      const data = await response.json()

      if (data.success) {
        setEditingAnswer(null)
        fetchResults()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">{t('dashboard.teacher.loading')}</div>
  }

  const gradedSubmissions = submissions.filter(s => s.status === 'GRADED' || s.status === 'RELEASED')
  const averageScore = gradedSubmissions.length > 0
    ? gradedSubmissions.reduce((sum, s) => sum + (s.totalScore || 0), 0) / gradedSubmissions.length
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">{t('dashboard.teacher.testResultsTitle')}</h1>
            <button onClick={() => router.push('/teacher/tests')} className="btn-secondary">
              {t('dashboard.teacher.back')}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.teacher.totalSubmissionsLabel')}</h3>
            <p className="text-3xl font-bold text-gray-900">{submissions.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.teacher.gradedLabel')}</h3>
            <p className="text-3xl font-bold text-green-600">{gradedSubmissions.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.teacher.averageScoreLabel')}</h3>
            <p className="text-3xl font-bold text-primary-600">{averageScore.toFixed(1)}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('dashboard.teacher.passRateLabel')}</h3>
            <p className="text-3xl font-bold text-blue-600">
              {gradedSubmissions.length > 0
                ? Math.round((gradedSubmissions.filter(s => (s.totalScore || 0) >= (s.maxScore || 0) * 0.6).length / gradedSubmissions.length) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Submissions List */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.teacher.studentSubmissionsTitle')}</h2>

            {submissions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('dashboard.teacher.noSubmissionsYet')}</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div key={submission.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className={`
                        w-full text-left p-4 border-2 rounded-lg transition-all
                        ${selectedSubmission?.id === submission.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{submission.student.name}</h3>
                          <p className="text-sm text-gray-600">{submission.student.email}</p>
                          <div className="mt-1">
                            <span className={`
                              text-xs px-2 py-1 rounded-full
                              ${submission.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${submission.status === 'GRADED' ? 'bg-blue-100 text-blue-800' : ''}
                              ${submission.status === 'RELEASED' ? 'bg-green-100 text-green-800' : ''}
                            `}>
                              {submission.status === 'SUBMITTED' ? t('dashboard.teacher.statusSubmittedText') : ''}
                              {submission.status === 'GRADED' ? t('dashboard.teacher.statusGradedText') : ''}
                              {submission.status === 'RELEASED' ? t('dashboard.teacher.statusReleasedText') : ''}
                            </span>
                          </div>
                        </div>
                        {(submission.status === 'GRADED' || submission.status === 'RELEASED') && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              {submission.totalScore}/{submission.maxScore}
                            </div>
                            <div className="text-sm text-gray-500">
                              {Math.round((submission.totalScore! / submission.maxScore!) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {submission.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleGradeWithAI(submission.id)}
                          disabled={grading === submission.id}
                          className="btn-primary flex-1 text-sm disabled:opacity-50"
                        >
                          {grading === submission.id ? t('dashboard.teacher.gradingProgress') : t('dashboard.teacher.gradeWithAI')}
                        </button>
                      )}

                      {submission.status === 'GRADED' && (
                        <button
                          onClick={() => handleRelease(submission.id)}
                          disabled={releasing === submission.id}
                          className="btn-primary flex-1 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {releasing === submission.id ? t('dashboard.teacher.releasingProgress') : t('dashboard.teacher.releaseResultsBtn')}
                        </button>
                      )}

                      {submission.status === 'RELEASED' && (
                        <div className="text-sm text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg">
                          {t('dashboard.teacher.resultsReleasedText')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Answer Details */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.teacher.answerDetailsTitle')}</h2>

            {!selectedSubmission ? (
              <p className="text-center text-gray-500 py-8">{t('dashboard.teacher.selectSubmissionHint')}</p>
            ) : (
              <div className="space-y-4">
                {selectedSubmission.answers.map((answer, idx) => (
                  <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="font-semibold">{t('dashboard.teacher.questionN')} {idx + 1}</span>
                      <span className="ml-2 text-sm text-gray-500">({answer.question.type})</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{answer.question.content}</p>

                    <div className="bg-gray-50 p-3 rounded mb-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('dashboard.teacher.studentAnswerLabel')}</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer.response || t('dashboard.teacher.noAnswerText')}</p>
                    </div>

                    {editingAnswer === answer.id ? (
                      <div className="space-y-3 bg-blue-50 p-3 rounded border border-blue-200">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {t('dashboard.teacher.score')} (max: {answer.question.points})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={answer.question.points}
                            step="0.5"
                            value={editScore}
                            onChange={(e) => setEditScore(parseFloat(e.target.value))}
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            {t('dashboard.teacher.feedbackPlaceholder')}
                          </label>
                          <textarea
                            value={editFeedback}
                            onChange={(e) => setEditFeedback(e.target.value)}
                            rows={3}
                            className="input-field"
                            placeholder={t('dashboard.teacher.feedbackPlaceholder')}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditAnswer(answer.id)} className="btn-primary text-sm">
                            {t('dashboard.common.save')}
                          </button>
                          <button onClick={() => setEditingAnswer(null)} className="btn-secondary text-sm">
                            {t('dashboard.common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm">
                            <span className="font-semibold text-primary-600">
                              {answer.teacherScore !== null
                                ? `${answer.teacherScore}/${answer.question.points} (Teacher)`
                                : `${answer.aiScore || 0}/${answer.question.points} (AI)`
                              }
                            </span>
                            {answer.aiConfidence && answer.teacherScore === null && (
                              <span className="ml-2 text-gray-500">
                                ({Math.round(answer.aiConfidence * 100)}% confidence)
                              </span>
                            )}
                          </div>
                          {selectedSubmission.status !== 'RELEASED' && (
                            <button
                              onClick={() => {
                                setEditingAnswer(answer.id)
                                setEditScore(answer.teacherScore !== null ? answer.teacherScore : (answer.aiScore || 0))
                                setEditFeedback(answer.teacherFeedback || answer.aiFeedback || '')
                              }}
                              className="text-sm text-primary-600 hover:text-primary-800"
                            >
                              {t('dashboard.teacher.editBtn')}
                            </button>
                          )}
                        </div>

                        {answer.aiFeedback && answer.teacherScore === null && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded mb-2">
                            <p className="text-xs font-medium text-blue-900 mb-1">{t('dashboard.teacher.aiFeedbackLabel')}</p>
                            <p className="text-xs text-blue-800">{answer.aiFeedback}</p>
                          </div>
                        )}

                        {answer.teacherFeedback && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs font-medium text-green-900 mb-1">{t('dashboard.teacher.teacherFeedbackLabel')}</p>
                            <p className="text-xs text-green-800">{answer.teacherFeedback}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
