import { openai } from './openai'

export interface GradingResult {
  score: number
  maxScore: number
  feedback: string
  confidence: number
  tokensUsed: number
}

export interface BatchGradingResult {
  studentIndex: number
  score: number
  feedback: string
  confidence: number
}

export async function gradeAnswer(
  question: {
    type: string
    content: string
    points: number
    options?: any
    correctAnswer?: string
    rubric?: any
    config?: any
  },
  studentAnswer: string
): Promise<GradingResult> {

  // GeoGebra / Desmos grading
  if (question.type === 'GEOGEBRA' || question.type === 'DESMOS') {
    const cfg = question.config as { responseType?: string; correctAnswer?: string; tolerance?: number } | null
    const responseType = cfg?.responseType ?? 'observe'

    // Observe: automatic full score
    if (responseType === 'observe') {
      return { score: question.points, maxScore: question.points, feedback: 'Tam puan (gözlem sorusu).', confidence: 1, tokensUsed: 0 }
    }

    // Numeric: exact match within tolerance
    if (responseType === 'numeric') {
      const expected = parseFloat(cfg?.correctAnswer ?? '')
      const actual   = parseFloat(studentAnswer ?? '')
      if (isNaN(expected)) {
        return { score: question.points, maxScore: question.points, feedback: 'Doğru cevap tanımlanmamış, tam puan verildi.', confidence: 0.5, tokensUsed: 0 }
      }
      if (isNaN(actual)) {
        return { score: 0, maxScore: question.points, feedback: 'Geçerli bir sayı girilmedi.', confidence: 1, tokensUsed: 0 }
      }
      const tolerance = cfg?.tolerance ?? 0.01
      const isCorrect = Math.abs(actual - expected) <= tolerance
      return {
        score: isCorrect ? question.points : 0,
        maxScore: question.points,
        feedback: isCorrect ? `Doğru! (Beklenen: ${expected}, Tolerans: ±${tolerance})` : `Yanlış. Beklenen cevap: ${expected} (±${tolerance}), Girilen: ${actual}`,
        confidence: 1,
        tokensUsed: 0,
      }
    }

    // Text: fall through to SHORT_ANSWER AI grading logic below using correctAnswer as expected
    // Re-route as SHORT_ANSWER for AI evaluation
    question = { ...question, type: 'SHORT_ANSWER', correctAnswer: cfg?.correctAnswer }
  }

  // Multiple Choice - Exact match (no AI needed)
  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
    const isCorrect = studentAnswer.trim() === question.correctAnswer?.trim()
    return {
      score: isCorrect ? question.points : 0,
      maxScore: question.points,
      feedback: isCorrect
        ? 'Correct!'
        : `Incorrect. The correct answer is: ${question.correctAnswer}`,
      confidence: 1.0,
      tokensUsed: 0,
    }
  }

  // Short Answer - gpt-4o-mini (cost efficient)
  if (question.type === 'SHORT_ANSWER') {
    try {
      const prompt = `You are grading a short answer question.

Question: ${question.content}
Expected Answer: ${question.correctAnswer || 'Use your best judgment'}
Student Answer: ${studentAnswer}
Max Points: ${question.points}

Provide a grade out of ${question.points} points and brief feedback.
Be fair but strict. Award partial credit if partially correct.

Respond in JSON format:
{
  "score": <number 0-${question.points}>,
  "feedback": "<brief feedback>",
  "confidence": <0.0-1.0>
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: Math.min(result.score || 0, question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Graded by AI',
        confidence: result.confidence || 0.8,
        tokensUsed: response.usage?.total_tokens ?? 0,
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return { score: 0, maxScore: question.points, feedback: 'Error grading this answer. Please review manually.', confidence: 0, tokensUsed: 0 }
    }
  }

  // Essay - gpt-4o-mini
  if (question.type === 'ESSAY') {
    try {
      const rubricText = question.rubric
        ? `Grading Rubric: ${JSON.stringify(question.rubric)}`
        : 'Use standard essay grading criteria: clarity, organization, evidence, grammar.'

      const prompt = `You are grading an essay question.

Question: ${question.content}
${rubricText}
Max Points: ${question.points}

Student Essay:
${studentAnswer}

Provide a detailed grade and constructive feedback.

Respond in JSON format:
{
  "score": <number 0-${question.points}>,
  "feedback": "<detailed feedback with strengths and areas for improvement>",
  "confidence": <0.0-1.0>
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: Math.min(result.score || 0, question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Graded by AI',
        confidence: result.confidence || 0.7,
        tokensUsed: response.usage?.total_tokens ?? 0,
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return { score: 0, maxScore: question.points, feedback: 'Error grading this essay. Please review manually.', confidence: 0, tokensUsed: 0 }
    }
  }

  // Code - gpt-4o-mini
  if (question.type === 'CODE') {
    try {
      const prompt = `You are grading a coding question.

Question: ${question.content}
Expected Solution: ${question.correctAnswer || 'Judge based on correctness and best practices'}
Max Points: ${question.points}

Student Code:
\`\`\`
${studentAnswer}
\`\`\`

Evaluate:
1. Correctness
2. Code quality
3. Efficiency
4. Best practices

Respond in JSON format:
{
  "score": <number 0-${question.points}>,
  "feedback": "<feedback on correctness, quality, and suggestions>",
  "confidence": <0.0-1.0>
}`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: Math.min(result.score || 0, question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Graded by AI',
        confidence: result.confidence || 0.7,
        tokensUsed: response.usage?.total_tokens ?? 0,
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return { score: 0, maxScore: question.points, feedback: 'Error grading this code. Please review manually.', confidence: 0, tokensUsed: 0 }
    }
  }

  // Fallback
  return { score: 0, maxScore: question.points, feedback: 'Unable to grade this question type automatically.', confidence: 0, tokensUsed: 0 }
}

/**
 * Batch grade multiple students' answers for the SAME question in a single API call.
 * Saves tokens compared to individual gradeAnswer() calls per student.
 */
export async function batchGradeQuestion(
  question: {
    type: string
    content: string
    points: number
    correctAnswer?: string
    rubric?: any
  },
  studentAnswers: { studentIndex: number; answer: string }[]
): Promise<{ results: BatchGradingResult[]; tokensUsed: number }> {
  // Exact-match types: no AI needed
  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
    return {
      results: studentAnswers.map(({ studentIndex, answer }) => {
        const isCorrect = answer.trim() === question.correctAnswer?.trim()
        return {
          studentIndex,
          score: isCorrect ? question.points : 0,
          feedback: isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`,
          confidence: 1.0,
        }
      }),
      tokensUsed: 0,
    }
  }

  if (studentAnswers.length === 0) return { results: [], tokensUsed: 0 }

  // Single answer — use regular grading
  if (studentAnswers.length === 1) {
    const r = await gradeAnswer(question, studentAnswers[0].answer)
    return {
      results: [{ studentIndex: studentAnswers[0].studentIndex, score: r.score, feedback: r.feedback, confidence: r.confidence }],
      tokensUsed: r.tokensUsed,
    }
  }

  const rubricText = question.rubric
    ? `Grading Rubric: ${JSON.stringify(question.rubric)}`
    : ''

  const answersBlock = studentAnswers
    .map(({ studentIndex, answer }) => `Student ${studentIndex}:\n${answer || '(no answer provided)'}`)
    .join('\n\n---\n\n')

  const prompt = `Grade the following student answers for this question.

Question: ${question.content}
${question.correctAnswer ? `Expected Answer: ${question.correctAnswer}` : ''}
${rubricText}
Max Points: ${question.points}

${answersBlock}

Return a JSON array with one entry per student. Use the exact studentIndex values provided:
[
  { "studentIndex": <number>, "score": <0-${question.points}>, "feedback": "<constructive feedback>", "confidence": <0.0-1.0> },
  ...
]

Be consistent and fair across all students.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const raw = JSON.parse(response.choices[0].message.content || '{}')
    // API may return { results: [...] } or directly [...]
    const arr: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.grades ?? [])

    const results: BatchGradingResult[] = arr.map((item: any) => ({
      studentIndex: item.studentIndex,
      score: Math.min(Number(item.score) || 0, question.points),
      feedback: item.feedback || 'Graded by AI',
      confidence: Number(item.confidence) || 0.7,
    }))

    return { results, tokensUsed: response.usage?.total_tokens ?? 0 }
  } catch (error) {
    console.error('Batch grading error:', error)
    // Fallback: individual grading
    let totalTokens = 0
    const results: BatchGradingResult[] = []
    for (const { studentIndex, answer } of studentAnswers) {
      const r = await gradeAnswer(question, answer)
      results.push({ studentIndex, score: r.score, feedback: r.feedback, confidence: r.confidence })
      totalTokens += r.tokensUsed
    }
    return { results, tokensUsed: totalTokens }
  }
}
