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

  // ── Drawing ────────────────────────────────────────────────────────────────
  if (question.type === 'DRAWING') {
    const cfg = question.config as { gradingType?: string; rubric?: string } | null
    if (cfg?.gradingType === 'ai' && studentAnswer) {
      try {
        const base64 = studentAnswer.includes('base64,') ? studentAnswer.split('base64,')[1] : studentAnswer
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 200,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Bu çizimi değerlendir. Beklenti: ${cfg.rubric || 'Genel değerlendirme yap'}. Puan: 0-${question.points} arası ver. JSON: {"score": number, "feedback": "string"}` },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'low' } },
            ],
          }],
          response_format: { type: 'json_object' },
        })
        const result = JSON.parse(response.choices[0].message.content ?? '{}')
        return { score: Math.min(result.score ?? 0, question.points), maxScore: question.points, feedback: result.feedback ?? '', confidence: 0.8, tokensUsed: response.usage?.total_tokens ?? 0 }
      } catch {
        return { score: 0, maxScore: question.points, feedback: 'AI değerlendirme başarısız. Manuel inceleme gerekli.', confidence: 0, tokensUsed: 0 }
      }
    }
    // Manual: pending teacher review
    return { score: 0, maxScore: question.points, feedback: 'Manuel değerlendirme bekliyor.', confidence: 0, tokensUsed: 0 }
  }

  // ── Label Drag ─────────────────────────────────────────────────────────────
  if (question.type === 'LABEL_DRAG') {
    const cfg = question.config as { labels?: Array<{ id: string; correctX: number; correctY: number }>; tolerance?: number } | null
    if (!cfg?.labels?.length) return { score: question.points, maxScore: question.points, feedback: 'Etiket tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    let placements: Record<string, { x: number; y: number }> = {}
    try { placements = JSON.parse(studentAnswer) } catch { /* empty */ }
    const tolerance = cfg.tolerance ?? 10
    let correct = 0
    const feedbackParts: string[] = []
    for (const label of cfg.labels) {
      const p = placements[label.id]
      if (!p) { feedbackParts.push(`"${label.id}" yerleştirilmedi`); continue }
      const dist = Math.sqrt(Math.pow(p.x - label.correctX, 2) + Math.pow(p.y - label.correctY, 2))
      if (dist <= tolerance) { correct++; } else { feedbackParts.push(`"${label.id}" yanlış konumda`) }
    }
    const score = Math.round((correct / cfg.labels.length) * question.points)
    return { score, maxScore: question.points, feedback: score === question.points ? 'Tüm etiketler doğru!' : feedbackParts.join(', '), confidence: 1, tokensUsed: 0 }
  }

  // ── Label Fill ─────────────────────────────────────────────────────────────
  if (question.type === 'LABEL_FILL') {
    const cfg = question.config as { labels?: Array<{ id: string; correctAnswers: string[]; caseSensitive: boolean }> } | null
    if (!cfg?.labels?.length) return { score: question.points, maxScore: question.points, feedback: 'Etiket tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    let answers: Record<string, string> = {}
    try { answers = JSON.parse(studentAnswer) } catch { /* empty */ }
    let correct = 0
    for (const label of cfg.labels) {
      const studentAns = answers[label.id]?.trim() ?? ''
      const match = label.correctAnswers.some(ca =>
        label.caseSensitive ? ca === studentAns : ca.toLowerCase() === studentAns.toLowerCase()
      )
      if (match) correct++
    }
    const score = Math.round((correct / cfg.labels.length) * question.points)
    return { score, maxScore: question.points, feedback: `${correct}/${cfg.labels.length} etiket doğru.`, confidence: 1, tokensUsed: 0 }
  }

  // ── Hotspot ────────────────────────────────────────────────────────────────
  if (question.type === 'HOTSPOT') {
    const cfg = question.config as { hotspots?: Array<{ id: string }>; requireAll?: boolean } | null
    if (!cfg?.hotspots?.length) return { score: question.points, maxScore: question.points, feedback: 'Hotspot tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    let selected: string[] = []
    try { selected = JSON.parse(studentAnswer) } catch { /* empty */ }
    const correctIds = cfg.hotspots.map(h => h.id)
    const correctHits = selected.filter(id => correctIds.includes(id)).length
    if (cfg.requireAll) {
      const score = Math.round((correctHits / correctIds.length) * question.points)
      return { score, maxScore: question.points, feedback: `${correctHits}/${correctIds.length} alan doğru seçildi.`, confidence: 1, tokensUsed: 0 }
    }
    const isCorrect = correctHits >= 1
    return { score: isCorrect ? question.points : 0, maxScore: question.points, feedback: isCorrect ? 'Doğru alan seçildi.' : 'Doğru alan seçilmedi.', confidence: 1, tokensUsed: 0 }
  }

  // ── Audio Response ─────────────────────────────────────────────────────────
  if (question.type === 'AUDIO_RESPONSE') {
    const cfg = question.config as { gradingType?: string; rubric?: string } | null
    if (cfg?.gradingType === 'ai' && studentAnswer) {
      // Transcript-based AI grading — route as SHORT_ANSWER with rubric
      question = { ...question, type: 'SHORT_ANSWER', correctAnswer: cfg.rubric }
      // Fall through to SHORT_ANSWER grading below
    } else {
      return { score: 0, maxScore: question.points, feedback: 'Manuel değerlendirme bekliyor.', confidence: 0, tokensUsed: 0 }
    }
  }

  // ── Group ──────────────────────────────────────────────────────────────────
  if (question.type === 'GROUP') {
    const cfg = question.config as { subQuestions?: Array<{ id: string; type: string; content: string; points: number; options?: string[]; correctAnswer?: string; config?: any; rubric?: string }> } | null
    if (!cfg?.subQuestions?.length) {
      return { score: 0, maxScore: question.points, feedback: 'Alt soru tanımı yok.', confidence: 0, tokensUsed: 0 }
    }
    let groupAnswers: Record<string, string> = {}
    try { groupAnswers = JSON.parse(studentAnswer) } catch { /* empty */ }

    let totalScore = 0
    let totalTokens = 0
    const feedbackParts: string[] = []
    const maxScore = cfg.subQuestions.reduce((s, sq) => s + sq.points, 0)

    for (let i = 0; i < cfg.subQuestions.length; i++) {
      const sq = cfg.subQuestions[i]
      const sqAnswer = groupAnswers[sq.id] ?? ''
      const result = await gradeAnswer(
        { type: sq.type, content: sq.content, points: sq.points, options: sq.options, correctAnswer: sq.correctAnswer, rubric: sq.rubric, config: sq.config },
        sqAnswer,
      )
      totalScore += result.score
      totalTokens += result.tokensUsed
      feedbackParts.push(`Alt Soru ${i + 1}: ${result.feedback}`)
    }
    return { score: totalScore, maxScore, feedback: feedbackParts.join('\n'), confidence: 0.9, tokensUsed: totalTokens }
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
