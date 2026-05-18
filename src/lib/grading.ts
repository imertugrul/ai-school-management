import Anthropic from '@anthropic-ai/sdk'
import { openai } from './openai'
import { prisma } from './prisma'

export interface GradingResult {
  score: number
  maxScore: number
  feedback: string
  confidence: number
  tokensUsed: number
  model?: string
  cached?: boolean
}

export interface BatchGradingResult {
  studentIndex: number
  score: number
  feedback: string
  confidence: number
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const VISION_MODEL = 'gpt-4o-mini'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonParse<T>(text: string, fallback: T): T {
  try { return JSON.parse(text) as T } catch { return fallback }
}

function eq(a: string, b: string): boolean {
  return (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()
}

function extractJson(text: string): any {
  // Strip code fences then try to find first JSON object/array
  const cleaned = text.replace(/```(?:json)?/g, '').trim()
  try { return JSON.parse(cleaned) } catch { /* fall through */ }
  const match = cleaned.match(/[\[{][\s\S]*[\]}]/)
  if (match) {
    try { return JSON.parse(match[0]) } catch { /* fall through */ }
  }
  return {}
}

// ── MCQ feedback cache ───────────────────────────────────────────────────────

/**
 * Returns an explanation for why `wrongAnswer` is wrong. Looks in the cache first;
 * only calls the model on the first occurrence of a (questionId, wrongAnswer) pair.
 * Returns { feedback, tokensUsed, cached } so callers can log.
 */
async function getMCQFeedback(
  questionId: string | undefined,
  questionContent: string,
  correctAnswer: string,
  wrongAnswer: string,
): Promise<{ feedback: string; tokensUsed: number; cached: boolean }> {
  const fallback = `Yanlış. Doğru cevap: ${correctAnswer}`
  if (!wrongAnswer?.trim()) return { feedback: 'Cevap verilmedi.', tokensUsed: 0, cached: true }
  if (!questionId || !anthropic) return { feedback: fallback, tokensUsed: 0, cached: true }

  try {
    const cached = await prisma.questionFeedbackCache.findUnique({
      where: { questionId_wrongAnswer: { questionId, wrongAnswer } },
    })
    if (cached) return { feedback: cached.feedback, tokensUsed: 0, cached: true }
  } catch {
    // table may not exist yet on first deploy — fall through to AI
  }

  try {
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 100,
      system: 'Kısa, net Türkçe geri bildirim ver. Tek paragraf, 1-2 cümle.',
      messages: [{
        role: 'user',
        content: `Soru: ${questionContent}\nDoğru: ${correctAnswer}\nÖğrenci: ${wrongAnswer}\nNeden yanlış? 1-2 cümle.`,
      }],
    })
    const block = response.content[0]
    const feedback = block.type === 'text' ? block.text.trim() : fallback
    const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

    // Best-effort cache write
    try {
      await prisma.questionFeedbackCache.create({
        data: { questionId, wrongAnswer, feedback, model: HAIKU_MODEL },
      })
    } catch { /* unique race or missing table — ignore */ }

    return { feedback, tokensUsed, cached: false }
  } catch (err) {
    console.error('MCQ feedback error:', err)
    return { feedback: fallback, tokensUsed: 0, cached: true }
  }
}

// ── Haiku grading (text questions) ───────────────────────────────────────────

async function gradeWithHaiku(
  prompt: string,
  maxTokens: number,
  systemPrompt: string,
): Promise<{ score: number; feedback: string; confidence: number; tokensUsed: number }> {
  if (!anthropic) {
    // Fall back to OpenAI if Anthropic isn't configured
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })
    const parsed = extractJson(response.choices[0].message.content ?? '{}')
    return {
      score: Number(parsed.score) || 0,
      feedback: parsed.feedback || 'AI tarafından değerlendirildi.',
      confidence: Number(parsed.confidence) || 0.7,
      tokensUsed: response.usage?.total_tokens ?? 0,
    }
  }

  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = response.content[0]
  const text = block.type === 'text' ? block.text : '{}'
  const parsed = extractJson(text)
  return {
    score: Number(parsed.score) || 0,
    feedback: parsed.feedback || 'AI tarafından değerlendirildi.',
    confidence: Number(parsed.confidence) || 0.7,
    tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
  }
}

// ── Algorithmic graders ──────────────────────────────────────────────────────

function gradeMcqSingle(
  studentAnswer: string,
  correctAnswer: string,
  maxPoints: number,
): { isCorrect: boolean; result: GradingResult } {
  const isCorrect = eq(studentAnswer, correctAnswer)
  return {
    isCorrect,
    result: {
      score: isCorrect ? maxPoints : 0,
      maxScore: maxPoints,
      feedback: isCorrect ? 'Doğru!' : '',
      confidence: 1,
      tokensUsed: 0,
    },
  }
}

function gradeMcqMultiple(
  studentAnswer: string,
  correctAnswer: string,
  maxPoints: number,
): { result: GradingResult; wrongSelections: string[] } {
  const correct: string[] = safeJsonParse(correctAnswer ?? '[]', [])
  const selected: string[] = safeJsonParse(studentAnswer ?? '[]', [])
  if (correct.length === 0) {
    return { result: { score: 0, maxScore: maxPoints, feedback: 'Doğru cevap tanımlı değil.', confidence: 0, tokensUsed: 0 }, wrongSelections: [] }
  }
  const correctSet = new Set(correct.map(c => c.trim().toLowerCase()))
  const selectedSet = new Set(selected.map(s => s.trim().toLowerCase()))
  const hits = [...selectedSet].filter(s => correctSet.has(s)).length
  const wrongSelections = selected.filter(s => !correctSet.has(s.trim().toLowerCase()))
  const missed = correct.filter(c => !selectedSet.has(c.trim().toLowerCase()))
  const score = Math.max(0, Math.round((hits / correct.length) * maxPoints) - wrongSelections.length)
  const finalScore = Math.min(Math.max(score, 0), maxPoints)
  return {
    result: {
      score: finalScore,
      maxScore: maxPoints,
      feedback: finalScore === maxPoints
        ? 'Tümü doğru!'
        : `${hits}/${correct.length} doğru. ${missed.length ? `Eksik: ${missed.join(', ')}. ` : ''}${wrongSelections.length ? `Yanlış: ${wrongSelections.join(', ')}.` : ''}`.trim(),
      confidence: 1,
      tokensUsed: 0,
    },
    wrongSelections,
  }
}

function gradeFillText(
  studentAnswer: string,
  question: { config?: any; correctAnswer?: string; points: number },
): GradingResult {
  // Each blank can have a list of acceptable answers (config.blanks: string[][] or string[])
  const cfg = question.config as { blanks?: any[]; caseSensitive?: boolean } | null
  const blanksDef: any[] = cfg?.blanks ?? []
  const caseSensitive = cfg?.caseSensitive ?? false
  const studentBlanks: string[] = safeJsonParse(studentAnswer ?? '[]', [])

  // Also accept legacy: correctAnswer stored as single string for single-blank questions
  if (blanksDef.length === 0 && question.correctAnswer) {
    const ok = caseSensitive
      ? (studentBlanks[0] ?? studentAnswer ?? '').trim() === question.correctAnswer.trim()
      : eq(studentBlanks[0] ?? studentAnswer ?? '', question.correctAnswer)
    return {
      score: ok ? question.points : 0,
      maxScore: question.points,
      feedback: ok ? 'Doğru!' : `Yanlış. Beklenen: ${question.correctAnswer}`,
      confidence: 1,
      tokensUsed: 0,
    }
  }

  if (blanksDef.length === 0) {
    return { score: 0, maxScore: question.points, feedback: 'Boşluk tanımı yok.', confidence: 0, tokensUsed: 0 }
  }

  let correct = 0
  for (let i = 0; i < blanksDef.length; i++) {
    const def = blanksDef[i]
    const accepted: string[] = Array.isArray(def) ? def : (typeof def === 'string' ? [def] : (def?.accepted ?? def?.options ?? []))
    const studentBlank = (studentBlanks[i] ?? '').toString().trim()
    if (!studentBlank) continue
    const match = accepted.some((a: string) =>
      caseSensitive ? a.trim() === studentBlank : eq(a, studentBlank)
    )
    if (match) correct++
  }
  const score = Math.round((correct / blanksDef.length) * question.points)
  return {
    score,
    maxScore: question.points,
    feedback: `${correct}/${blanksDef.length} boşluk doğru.`,
    confidence: 1,
    tokensUsed: 0,
  }
}

function gradeFillDropdown(studentAnswer: string, config: any, maxPoints: number): GradingResult {
  const blanks: { correct: string }[] = config?.blanks ?? []
  if (blanks.length === 0) return { score: 0, maxScore: maxPoints, feedback: 'Açılır menü tanımı yok.', confidence: 0, tokensUsed: 0 }
  const studentChoices: string[] = safeJsonParse(studentAnswer ?? '[]', [])
  let correct = 0
  for (let i = 0; i < blanks.length; i++) {
    if (eq(studentChoices[i] ?? '', blanks[i].correct)) correct++
  }
  const score = Math.round((correct / blanks.length) * maxPoints)
  return { score, maxScore: maxPoints, feedback: `${correct}/${blanks.length} seçim doğru.`, confidence: 1, tokensUsed: 0 }
}

function gradeMatch(studentAnswer: string, config: any, maxPoints: number): GradingResult {
  const pairs: { left: string; right: string }[] = config?.pairs ?? []
  if (pairs.length === 0) return { score: 0, maxScore: maxPoints, feedback: 'Eşleştirme tanımı yok.', confidence: 0, tokensUsed: 0 }
  const studentPairs: Record<string, string> = safeJsonParse(studentAnswer ?? '{}', {})
  let correct = 0
  for (const p of pairs) {
    if (eq(studentPairs[p.left] ?? '', p.right)) correct++
  }
  const score = Math.round((correct / pairs.length) * maxPoints)
  return { score, maxScore: maxPoints, feedback: `${correct}/${pairs.length} eşleşme doğru.`, confidence: 1, tokensUsed: 0 }
}

function gradeSort(studentAnswer: string, config: any, maxPoints: number): GradingResult {
  const items: string[] = config?.items ?? []
  if (items.length === 0) return { score: 0, maxScore: maxPoints, feedback: 'Sıralama tanımı yok.', confidence: 0, tokensUsed: 0 }
  const studentOrder: string[] = safeJsonParse(studentAnswer ?? '[]', [])
  let correct = 0
  for (let i = 0; i < items.length; i++) {
    if (eq(studentOrder[i] ?? '', items[i])) correct++
  }
  const score = Math.round((correct / items.length) * maxPoints)
  return { score, maxScore: maxPoints, feedback: correct === items.length ? 'Sıralama tam doğru!' : `${correct}/${items.length} pozisyon doğru.`, confidence: 1, tokensUsed: 0 }
}

function gradeClassify(studentAnswer: string, config: any, maxPoints: number): GradingResult {
  const defs: { text: string; category: string }[] = config?.items ?? []
  if (defs.length === 0) return { score: 0, maxScore: maxPoints, feedback: 'Sınıflandırma tanımı yok.', confidence: 0, tokensUsed: 0 }
  const studentMap: Record<string, string> = safeJsonParse(studentAnswer ?? '{}', {})
  let correct = 0
  for (const d of defs) {
    if (eq(studentMap[d.text] ?? '', d.category)) correct++
  }
  const score = Math.round((correct / defs.length) * maxPoints)
  return { score, maxScore: maxPoints, feedback: `${correct}/${defs.length} öğe doğru sınıflandırıldı.`, confidence: 1, tokensUsed: 0 }
}

function gradeTable(studentAnswer: string, config: any, maxPoints: number): GradingResult {
  const expectedRows: string[][] = config?.rows ?? []
  const totalCells = expectedRows.reduce((s, r) => s + r.length, 0)
  if (totalCells === 0) return { score: 0, maxScore: maxPoints, feedback: 'Tablo tanımı yok.', confidence: 0, tokensUsed: 0 }
  const studentRows: string[][] = safeJsonParse(studentAnswer ?? '[]', [])
  let correct = 0
  for (let r = 0; r < expectedRows.length; r++) {
    for (let c = 0; c < expectedRows[r].length; c++) {
      if (eq(studentRows[r]?.[c] ?? '', expectedRows[r][c])) correct++
    }
  }
  const score = Math.round((correct / totalCells) * maxPoints)
  return { score, maxScore: maxPoints, feedback: `${correct}/${totalCells} hücre doğru.`, confidence: 1, tokensUsed: 0 }
}

// ── Main grader ──────────────────────────────────────────────────────────────

export async function gradeAnswer(
  question: {
    id?: string
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

  // ── Exact / algorithmic types (zero token cost) ──
  if (question.type === 'MULTIPLE_CHOICE') {
    const { isCorrect, result } = gradeMcqSingle(studentAnswer, question.correctAnswer ?? '', question.points)
    if (isCorrect) return result
    const fb = await getMCQFeedback(question.id, question.content, question.correctAnswer ?? '', studentAnswer)
    return { ...result, feedback: fb.feedback, tokensUsed: fb.tokensUsed, model: fb.tokensUsed > 0 ? HAIKU_MODEL : undefined, cached: fb.cached }
  }

  if (question.type === 'TRUE_FALSE') {
    const { isCorrect, result } = gradeMcqSingle(studentAnswer, question.correctAnswer ?? '', question.points)
    if (isCorrect) return result
    return { ...result, feedback: `Yanlış. Doğru cevap: ${question.correctAnswer === 'true' ? 'Doğru' : 'Yanlış'}` }
  }

  if (question.type === 'MCQ_MULTIPLE') {
    const { result, wrongSelections } = gradeMcqMultiple(studentAnswer, question.correctAnswer ?? '', question.points)
    if (result.score === question.points || wrongSelections.length === 0) return result
    // Generate AI feedback only for wrong selections (cached)
    const key = wrongSelections.sort().join('|')
    const fb = await getMCQFeedback(question.id, question.content, question.correctAnswer ?? '', key)
    return { ...result, feedback: `${result.feedback} ${fb.feedback}`.trim(), tokensUsed: fb.tokensUsed, model: fb.tokensUsed > 0 ? HAIKU_MODEL : undefined, cached: fb.cached }
  }

  if (question.type === 'FILL_TEXT') return gradeFillText(studentAnswer, question)
  if (question.type === 'FILL_DROPDOWN') return gradeFillDropdown(studentAnswer, question.config, question.points)
  if (question.type === 'MATCH') return gradeMatch(studentAnswer, question.config, question.points)
  if (question.type === 'SORT') return gradeSort(studentAnswer, question.config, question.points)
  if (question.type === 'CLASSIFY') return gradeClassify(studentAnswer, question.config, question.points)
  if (question.type === 'TABLE') return gradeTable(studentAnswer, question.config, question.points)

  // ── GeoGebra / Desmos ──
  if (question.type === 'GEOGEBRA' || question.type === 'DESMOS') {
    const cfg = question.config as { responseType?: string; correctAnswer?: string; tolerance?: number } | null
    const responseType = cfg?.responseType ?? 'observe'

    if (responseType === 'observe') {
      return { score: question.points, maxScore: question.points, feedback: 'Tam puan (gözlem sorusu).', confidence: 1, tokensUsed: 0 }
    }
    if (responseType === 'numeric') {
      const expected = parseFloat(cfg?.correctAnswer ?? '')
      const actual = parseFloat(studentAnswer ?? '')
      if (isNaN(expected)) return { score: question.points, maxScore: question.points, feedback: 'Doğru cevap tanımlı değil, tam puan.', confidence: 0.5, tokensUsed: 0 }
      if (isNaN(actual)) return { score: 0, maxScore: question.points, feedback: 'Geçerli bir sayı girilmedi.', confidence: 1, tokensUsed: 0 }
      const tolerance = cfg?.tolerance ?? 0.01
      const ok = Math.abs(actual - expected) <= tolerance
      return {
        score: ok ? question.points : 0,
        maxScore: question.points,
        feedback: ok ? `Doğru (±${tolerance}).` : `Yanlış. Beklenen: ${expected} (±${tolerance}).`,
        confidence: 1,
        tokensUsed: 0,
      }
    }
    // text → SHORT_ANSWER path
    question = { ...question, type: 'SHORT_ANSWER', correctAnswer: cfg?.correctAnswer }
  }

  // ── Drawing (vision) ──
  if (question.type === 'DRAWING') {
    const cfg = question.config as { gradingType?: string; rubric?: string } | null
    if (cfg?.gradingType === 'ai' && studentAnswer) {
      try {
        const base64 = studentAnswer.includes('base64,') ? studentAnswer.split('base64,')[1] : studentAnswer
        const response = await openai.chat.completions.create({
          model: VISION_MODEL,
          max_tokens: 150,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Çizimi değerlendir. Beklenti: ${cfg.rubric || 'Genel değerlendirme'}. JSON: {"score":0-${question.points},"feedback":"kısa"}` },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'low' } },
            ],
          }],
          response_format: { type: 'json_object' },
        })
        const result = extractJson(response.choices[0].message.content ?? '{}')
        return {
          score: Math.min(Number(result.score) || 0, question.points),
          maxScore: question.points,
          feedback: result.feedback || '',
          confidence: 0.8,
          tokensUsed: response.usage?.total_tokens ?? 0,
          model: VISION_MODEL,
        }
      } catch {
        return { score: 0, maxScore: question.points, feedback: 'AI değerlendirme başarısız. Manuel inceleme.', confidence: 0, tokensUsed: 0 }
      }
    }
    return { score: 0, maxScore: question.points, feedback: 'Manuel değerlendirme bekliyor.', confidence: 0, tokensUsed: 0 }
  }

  // ── Label Drag ──
  if (question.type === 'LABEL_DRAG') {
    const cfg = question.config as { labels?: Array<{ id: string; correctX: number; correctY: number }>; tolerance?: number } | null
    if (!cfg?.labels?.length) return { score: question.points, maxScore: question.points, feedback: 'Etiket tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    const placements: Record<string, { x: number; y: number }> = safeJsonParse(studentAnswer, {})
    const tolerance = cfg.tolerance ?? 10
    let correct = 0
    const feedbackParts: string[] = []
    for (const label of cfg.labels) {
      const p = placements[label.id]
      if (!p) { feedbackParts.push(`"${label.id}" yerleştirilmedi`); continue }
      const dist = Math.sqrt(Math.pow(p.x - label.correctX, 2) + Math.pow(p.y - label.correctY, 2))
      if (dist <= tolerance) correct++
      else feedbackParts.push(`"${label.id}" yanlış konumda`)
    }
    const score = Math.round((correct / cfg.labels.length) * question.points)
    return { score, maxScore: question.points, feedback: score === question.points ? 'Tüm etiketler doğru!' : feedbackParts.join(', '), confidence: 1, tokensUsed: 0 }
  }

  // ── Label Fill ──
  if (question.type === 'LABEL_FILL') {
    const cfg = question.config as { labels?: Array<{ id: string; correctAnswers: string[]; caseSensitive: boolean }> } | null
    if (!cfg?.labels?.length) return { score: question.points, maxScore: question.points, feedback: 'Etiket tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    const answers: Record<string, string> = safeJsonParse(studentAnswer, {})
    let correct = 0
    for (const label of cfg.labels) {
      const studentAns = (answers[label.id] ?? '').trim()
      if (label.correctAnswers.some(ca => label.caseSensitive ? ca === studentAns : eq(ca, studentAns))) correct++
    }
    const score = Math.round((correct / cfg.labels.length) * question.points)
    return { score, maxScore: question.points, feedback: `${correct}/${cfg.labels.length} etiket doğru.`, confidence: 1, tokensUsed: 0 }
  }

  // ── Hotspot ──
  if (question.type === 'HOTSPOT') {
    const cfg = question.config as { hotspots?: Array<{ id: string }>; requireAll?: boolean } | null
    if (!cfg?.hotspots?.length) return { score: question.points, maxScore: question.points, feedback: 'Hotspot tanımı yok, tam puan.', confidence: 0.5, tokensUsed: 0 }
    const selected: string[] = safeJsonParse(studentAnswer, [])
    const correctIds = cfg.hotspots.map(h => h.id)
    const correctHits = selected.filter(id => correctIds.includes(id)).length
    if (cfg.requireAll) {
      const score = Math.round((correctHits / correctIds.length) * question.points)
      return { score, maxScore: question.points, feedback: `${correctHits}/${correctIds.length} alan doğru.`, confidence: 1, tokensUsed: 0 }
    }
    const ok = correctHits >= 1
    return { score: ok ? question.points : 0, maxScore: question.points, feedback: ok ? 'Doğru alan seçildi.' : 'Doğru alan seçilmedi.', confidence: 1, tokensUsed: 0 }
  }

  // ── Audio Response ──
  if (question.type === 'AUDIO_RESPONSE') {
    const cfg = question.config as { gradingType?: string; rubric?: string } | null
    if (cfg?.gradingType === 'ai' && studentAnswer) {
      question = { ...question, type: 'SHORT_ANSWER', correctAnswer: cfg.rubric }
      // fall through
    } else {
      return { score: 0, maxScore: question.points, feedback: 'Manuel değerlendirme bekliyor.', confidence: 0, tokensUsed: 0 }
    }
  }

  // ── Group (recursive) ──
  if (question.type === 'GROUP') {
    const cfg = question.config as { subQuestions?: Array<{ id: string; type: string; content: string; points: number; options?: string[]; correctAnswer?: string; config?: any; rubric?: string }> } | null
    if (!cfg?.subQuestions?.length) {
      return { score: 0, maxScore: question.points, feedback: 'Alt soru tanımı yok.', confidence: 0, tokensUsed: 0 }
    }
    const groupAnswers: Record<string, string> = safeJsonParse(studentAnswer, {})
    let totalScore = 0
    let totalTokens = 0
    const feedbackParts: string[] = []
    const maxScore = cfg.subQuestions.reduce((s, sq) => s + sq.points, 0)
    for (let i = 0; i < cfg.subQuestions.length; i++) {
      const sq = cfg.subQuestions[i]
      const result = await gradeAnswer(
        { type: sq.type, content: sq.content, points: sq.points, options: sq.options, correctAnswer: sq.correctAnswer, rubric: sq.rubric, config: sq.config },
        groupAnswers[sq.id] ?? '',
      )
      totalScore += result.score
      totalTokens += result.tokensUsed
      feedbackParts.push(`Alt ${i + 1}: ${result.feedback}`)
    }
    return { score: totalScore, maxScore, feedback: feedbackParts.join('\n'), confidence: 0.9, tokensUsed: totalTokens, model: HAIKU_MODEL }
  }

  // ── Short Answer (Haiku 4.5, max 100) ──
  if (question.type === 'SHORT_ANSWER') {
    if (!studentAnswer?.trim()) {
      return { score: 0, maxScore: question.points, feedback: 'Cevap verilmedi.', confidence: 1, tokensUsed: 0 }
    }
    try {
      const prompt = `Soru: ${question.content}\nBeklenen: ${question.correctAnswer || 'Mantıklı cevap'}\nÖğrenci: ${studentAnswer}\nMax: ${question.points} puan`
      const r = await gradeWithHaiku(prompt, 100, 'Öğrenci cevabını değerlendir. Kısmen doğruysa kısmi puan ver. Sadece JSON: {"score":sayı,"feedback":"kısa","confidence":0-1}')
      return { score: Math.min(r.score, question.points), maxScore: question.points, feedback: r.feedback, confidence: r.confidence, tokensUsed: r.tokensUsed, model: HAIKU_MODEL }
    } catch (err) {
      console.error('Short answer grading error:', err)
      return { score: 0, maxScore: question.points, feedback: 'AI değerlendirme başarısız.', confidence: 0, tokensUsed: 0 }
    }
  }

  // ── Essay / Long Answer (Haiku 4.5, max 250) ──
  if (question.type === 'ESSAY') {
    if (!studentAnswer?.trim()) {
      return { score: 0, maxScore: question.points, feedback: 'Cevap verilmedi.', confidence: 1, tokensUsed: 0 }
    }
    try {
      const rubric = question.rubric ? `Rubrik: ${typeof question.rubric === 'string' ? question.rubric : JSON.stringify(question.rubric)}\n` : ''
      const prompt = `Soru: ${question.content}\n${rubric}Öğrenci: ${studentAnswer}\nMax: ${question.points} puan`
      const r = await gradeWithHaiku(prompt, 250, 'Kompozisyonu değerlendir. Sadece JSON: {"score":sayı,"feedback":"yapıcı","confidence":0-1}')
      return { score: Math.min(r.score, question.points), maxScore: question.points, feedback: r.feedback, confidence: r.confidence, tokensUsed: r.tokensUsed, model: HAIKU_MODEL }
    } catch (err) {
      console.error('Essay grading error:', err)
      return { score: 0, maxScore: question.points, feedback: 'AI değerlendirme başarısız.', confidence: 0, tokensUsed: 0 }
    }
  }

  // ── Code (Haiku 4.5, max 200) ──
  if (question.type === 'CODE') {
    if (!studentAnswer?.trim()) {
      return { score: 0, maxScore: question.points, feedback: 'Cevap verilmedi.', confidence: 1, tokensUsed: 0 }
    }
    try {
      const prompt = `Soru: ${question.content}\nBeklenen: ${question.correctAnswer || 'En iyi pratiklere göre değerlendir'}\nKod:\n\`\`\`\n${studentAnswer}\n\`\`\`\nMax: ${question.points} puan`
      const r = await gradeWithHaiku(prompt, 200, 'Kodu doğruluk + kalite açısından değerlendir. Sadece JSON: {"score":sayı,"feedback":"kısa","confidence":0-1}')
      return { score: Math.min(r.score, question.points), maxScore: question.points, feedback: r.feedback, confidence: r.confidence, tokensUsed: r.tokensUsed, model: HAIKU_MODEL }
    } catch (err) {
      console.error('Code grading error:', err)
      return { score: 0, maxScore: question.points, feedback: 'AI değerlendirme başarısız.', confidence: 0, tokensUsed: 0 }
    }
  }

  // Fallback
  return { score: 0, maxScore: question.points, feedback: 'Bu soru tipi otomatik değerlendirilemiyor.', confidence: 0, tokensUsed: 0 }
}

/**
 * Batch grade multiple students' answers for the SAME question in a single API call.
 * Skips AI for algorithmic types and routes them through `gradeAnswer`.
 */
export async function batchGradeQuestion(
  question: {
    id?: string
    type: string
    content: string
    points: number
    options?: any
    correctAnswer?: string
    rubric?: any
    config?: any
  },
  studentAnswers: { studentIndex: number; answer: string }[]
): Promise<{ results: BatchGradingResult[]; tokensUsed: number; model?: string }> {
  if (studentAnswers.length === 0) return { results: [], tokensUsed: 0 }

  // Algorithmic / per-student types: just loop (no AI cost)
  const algorithmicTypes = new Set([
    'MULTIPLE_CHOICE', 'TRUE_FALSE', 'MCQ_MULTIPLE',
    'FILL_TEXT', 'FILL_DROPDOWN', 'MATCH', 'SORT', 'CLASSIFY', 'TABLE',
    'LABEL_DRAG', 'LABEL_FILL', 'HOTSPOT', 'GEOGEBRA', 'DESMOS',
  ])
  if (algorithmicTypes.has(question.type)) {
    let totalTokens = 0
    const results: BatchGradingResult[] = []
    for (const { studentIndex, answer } of studentAnswers) {
      const r = await gradeAnswer(question, answer)
      totalTokens += r.tokensUsed
      results.push({ studentIndex, score: r.score, feedback: r.feedback, confidence: r.confidence })
    }
    return { results, tokensUsed: totalTokens }
  }

  // Single answer — use regular grading
  if (studentAnswers.length === 1) {
    const r = await gradeAnswer(question, studentAnswers[0].answer)
    return {
      results: [{ studentIndex: studentAnswers[0].studentIndex, score: r.score, feedback: r.feedback, confidence: r.confidence }],
      tokensUsed: r.tokensUsed,
      model: r.model,
    }
  }

  // Batch with Haiku
  const rubricText = question.rubric
    ? `Rubrik: ${typeof question.rubric === 'string' ? question.rubric : JSON.stringify(question.rubric)}\n`
    : ''
  const answersBlock = studentAnswers
    .map(({ studentIndex, answer }) => `S${studentIndex}: ${answer || '(boş)'}`)
    .join('\n---\n')

  const prompt = `Soru: ${question.content}\n${question.correctAnswer ? `Beklenen: ${question.correctAnswer}\n` : ''}${rubricText}Max: ${question.points} puan\n\n${answersBlock}`

  const isEssay = question.type === 'ESSAY'
  const perAnswerTokens = isEssay ? 80 : 50
  const maxTokens = Math.min(2000, perAnswerTokens * studentAnswers.length + 100)
  const systemPrompt = `Her öğrenciyi değerlendir. Sadece JSON array: [{"studentIndex":num,"score":0-${question.points},"feedback":"kısa","confidence":0-1}]`

  try {
    if (!anthropic) {
      // OpenAI fallback
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })
      const raw = extractJson(response.choices[0].message.content ?? '{}')
      const arr: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.grades ?? [])
      return {
        results: arr.map((item: any) => ({
          studentIndex: Number(item.studentIndex) || 0,
          score: Math.min(Number(item.score) || 0, question.points),
          feedback: item.feedback || 'AI tarafından değerlendirildi.',
          confidence: Number(item.confidence) || 0.7,
        })),
        tokensUsed: response.usage?.total_tokens ?? 0,
        model: 'gpt-4o-mini',
      }
    }

    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    const text = block.type === 'text' ? block.text : '[]'
    const raw = extractJson(text)
    const arr: any[] = Array.isArray(raw) ? raw : (raw.results ?? raw.grades ?? [])
    return {
      results: arr.map((item: any) => ({
        studentIndex: Number(item.studentIndex) || 0,
        score: Math.min(Number(item.score) || 0, question.points),
        feedback: item.feedback || 'AI tarafından değerlendirildi.',
        confidence: Number(item.confidence) || 0.7,
      })),
      tokensUsed: (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
      model: HAIKU_MODEL,
    }
  } catch (error) {
    console.error('Batch grading error:', error)
    // Fallback to individual grading
    let totalTokens = 0
    const results: BatchGradingResult[] = []
    for (const { studentIndex, answer } of studentAnswers) {
      const r = await gradeAnswer(question, answer)
      results.push({ studentIndex, score: r.score, feedback: r.feedback, confidence: r.confidence })
      totalTokens += r.tokensUsed
    }
    return { results, tokensUsed: totalTokens, model: HAIKU_MODEL }
  }
}
