'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const GeoGebraStudent      = dynamic(() => import('@/components/questions/GeoGebraStudent'),      { ssr: false })
const DesmosStudent        = dynamic(() => import('@/components/questions/DesmosStudent'),        { ssr: false })
const DrawingStudent       = dynamic(() => import('@/components/questions/DrawingStudent'),       { ssr: false })
const LabelDragStudent     = dynamic(() => import('@/components/questions/LabelDragStudent'),     { ssr: false })
const LabelFillStudent     = dynamic(() => import('@/components/questions/LabelFillStudent'),     { ssr: false })
const HotspotStudent       = dynamic(() => import('@/components/questions/HotspotStudent'),       { ssr: false })
const AudioResponseStudent = dynamic(() => import('@/components/questions/AudioResponseStudent'), { ssr: false })
const GroupStudent         = dynamic(() => import('@/components/questions/GroupStudent'),         { ssr: false })

interface Question {
  id: string
  type: string
  content: string
  points: number
  options?: any
  config?: any
  orderIndex: number
}

export default function TakeTestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string
  const { data: session } = useSession()

  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [submission, setSubmission] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [tabSwitches, setTabSwitches] = useState(0)
  const [violations, setViolations] = useState<{type: string; count: number}[]>([])
  const [warningMsg, setWarningMsg] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchTest()
    }
  }, [session, testId])

  const reportViolation = (type: string) => {
    if (!submission) return
    fetch(`/api/submissions/${submission.id}/suspicious`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, timestamp: new Date().toISOString(), questionIndex: currentIndex }),
    })
    setViolations(prev => {
      const existing = prev.find(v => v.type === type)
      if (existing) return prev.map(v => v.type === type ? { ...v, count: v.count + 1 } : v)
      return [...prev, { type, count: 1 }]
    })
    const messages: Record<string, string> = {
      TAB_SWITCH: '⚠️ Sekme değiştirme kopya girişimi olarak kaydedildi!',
      WINDOW_BLUR: '⚠️ Pencere odağı kaybı kopya girişimi olarak kaydedildi!',
      COPY_PASTE: '⚠️ Kopyalama/yapıştırma kopya girişimi olarak kaydedildi!',
    }
    setWarningMsg(messages[type] ?? '⚠️ Bu eylem kopya girişimi olarak kaydedildi!')
    setTimeout(() => setWarningMsg(null), 4000)
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) { setTabSwitches(prev => prev + 1); reportViolation('TAB_SWITCH') }
    }
    const handleBlur = () => reportViolation('WINDOW_BLUR')
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); reportViolation('COPY_PASTE') }
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); reportViolation('COPY_PASTE') }
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [submission, currentIndex])

  useEffect(() => {
    if (!submission) return

    const interval = setInterval(() => {
      fetch(`/api/submissions/${submission.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentQuestionIndex: currentIndex,
          tabSwitchCount: tabSwitches,
        }),
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [submission, currentIndex, tabSwitches])

  const fetchTest = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}`)
      const data = await response.json()
      
      if (data.success) {
        const test = data.test
        
        const now = new Date()
        const startDate = test.startDate ? new Date(test.startDate) : null
        const endDate = test.endDate ? new Date(test.endDate) : null
        
        if (!test.isActive) {
          alert('This test is not active yet!')
          router.push('/student/dashboard')
          return
        }
        
        if (startDate && now < startDate) {
          alert(`This test will start on ${startDate.toLocaleString('en-US')}!`)
          router.push('/student/dashboard')
          return
        }
        
        if (endDate && now > endDate) {
          alert('This test has expired!')
          router.push('/student/dashboard')
          return
        }
        
        setTest(test)
        setQuestions(test.questions.sort((a: Question, b: Question) => a.orderIndex - b.orderIndex))
        
        await startOrContinueSubmission()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load test!')
    } finally {
      setLoading(false)
    }
  }

  const startOrContinueSubmission = async () => {
    try {
      const response = await fetch('/api/submissions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSubmission(data.submission)
        
        const existingAnswers: { [key: string]: string } = {}
        data.submission.answers?.forEach((ans: any) => {
          existingAnswers[ans.questionId] = ans.response
        })
        setAnswers(existingAnswers)
        
        setCurrentIndex(data.submission.currentQuestionIndex || 0)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleAnswerChange = async (questionId: string, value: string) => {
    setAnswers({ ...answers, [questionId]: value })
    
    if (submission) {
      await fetch(`/api/submissions/${submission.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          response: value,
        }),
      })
    }
  }

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id])
    
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
      )
      if (!confirm) return
    }

    try {
      const response = await fetch(`/api/submissions/${submission.id}/submit`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        alert('Test submitted successfully! Your teacher will grade and release results soon.')
        router.push('/student/dashboard')
      } else {
        alert('Failed to submit test!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to submit test!')
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading test...</div>
  }

  if (!test || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Test not found</div>
  }

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-primary-600">{test.title}</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Violation toast */}
      {warningMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-semibold animate-pulse max-w-sm text-center">
          {warningMsg}
        </div>
      )}

      {violations.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <p className="text-red-700 text-center text-sm font-medium">
            ⚠️ {violations.reduce((s, v) => s + v.count, 0)} ihlal kaydedildi — öğretmenin görebilir.
            {' '}({violations.map(v => `${v.count} ${v.type === 'TAB_SWITCH' ? 'sekme' : v.type === 'WINDOW_BLUR' ? 'pencere' : 'kopya'}`).join(', ')})
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            {Math.round(progress)}% Complete
          </p>
        </div>

        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Question {currentIndex + 1}
              </span>
              <span className="ml-2 text-sm text-primary-600 font-semibold">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </span>
            </div>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {currentQuestion.type.replace('_', ' ')}
            </span>
          </div>

          <p className="text-lg text-gray-900 mb-6 whitespace-pre-wrap">
            {currentQuestion.content}
          </p>

          {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option: string, idx: number) => (
                <label
                  key={idx}
                  className={`
                    flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all
                    ${answers[currentQuestion.id] === option 
                      ? 'border-primary-600 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'SHORT_ANSWER' && (
            <input
              type="text"
              className="input-field"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
            />
          )}

          {(currentQuestion.type === 'ESSAY' || currentQuestion.type === 'CODE') && (
            <textarea
              className="input-field font-mono"
              rows={10}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              placeholder={currentQuestion.type === 'CODE' ? 'Write your code here...' : 'Write your answer here...'}
            />
          )}

          {currentQuestion.type === 'GEOGEBRA' && currentQuestion.config && (
            <GeoGebraStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'DESMOS' && currentQuestion.config && (
            <DesmosStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'DRAWING' && currentQuestion.config && (
            <DrawingStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'LABEL_DRAG' && currentQuestion.config && (
            <LabelDragStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'LABEL_FILL' && currentQuestion.config && (
            <LabelFillStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'HOTSPOT' && currentQuestion.config && (
            <HotspotStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'AUDIO_RESPONSE' && currentQuestion.config && (
            <AudioResponseStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}

          {currentQuestion.type === 'GROUP' && currentQuestion.config && (
            <GroupStudent
              config={currentQuestion.config}
              value={answers[currentQuestion.id] || ''}
              onChange={v => handleAnswerChange(currentQuestion.id, v)}
            />
          )}
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary disabled:opacity-50"
          >
            ← Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="btn-primary flex-1"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
            >
              Submit Test
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`
                  p-2 rounded text-sm font-medium transition-all
                  ${idx === currentIndex 
                    ? 'bg-primary-600 text-white' 
                    : answers[q.id]
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}