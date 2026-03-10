import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

// Initialize AI clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null

export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'ESSAY' | 'CODE' | 'TRUE_FALSE'

export interface GradingRequest {
  questionType: QuestionType
  questionContent: string
  studentResponse: string
  rubric?: any
  correctAnswer?: string
  maxPoints: number
}

export interface GradingResult {
  score: number
  maxScore: number
  feedback: string
  confidence: number
}

/**
 * Main grading function - routes to appropriate grading method based on question type
 */
export async function gradeAnswer(request: GradingRequest): Promise<GradingResult> {
  switch (request.questionType) {
    case 'MULTIPLE_CHOICE':
    case 'TRUE_FALSE':
      return gradeMultipleChoice(request)
    
    case 'SHORT_ANSWER':
      return gradeShortAnswer(request)
    
    case 'ESSAY':
      return gradeEssay(request)
    
    case 'CODE':
      return gradeCode(request)
    
    default:
      throw new Error(`Unsupported question type: ${request.questionType}`)
  }
}

/**
 * Grade multiple choice questions (simple exact match)
 */
function gradeMultipleChoice(request: GradingRequest): GradingResult {
  const isCorrect = request.studentResponse.trim().toLowerCase() === 
                    request.correctAnswer?.trim().toLowerCase()
  
  return {
    score: isCorrect ? request.maxPoints : 0,
    maxScore: request.maxPoints,
    feedback: isCorrect 
      ? "Correct! Well done." 
      : `Incorrect. The correct answer is ${request.correctAnswer}.`,
    confidence: 1.0
  }
}

/**
 * Grade short answer questions using AI (semantic understanding)
 */
async function gradeShortAnswer(request: GradingRequest): Promise<GradingResult> {
  // Use GPT-3.5 for cost efficiency on short answers
  if (!openai && !anthropic) {
    throw new Error('No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
  }

  const prompt = `You are an expert teacher grading a short answer question.

Question: ${request.questionContent}
Correct Answer: ${request.correctAnswer}
Student's Response: ${request.studentResponse}
Maximum Points: ${request.maxPoints}

Grade the student's response. Consider:
1. Is the core concept correct?
2. Is the explanation adequate?
3. Are there minor errors that warrant partial credit?

Provide your response in this exact JSON format:
{
  "score": <number between 0 and ${request.maxPoints}>,
  "feedback": "<brief, constructive feedback explaining the grade>",
  "confidence": <number between 0 and 1 indicating your confidence in this grading>
}

Be fair but rigorous. Partial credit is okay for partially correct answers.`

  try {
    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: result.score,
        maxScore: request.maxPoints,
        feedback: result.feedback,
        confidence: result.confidence
      }
    } else if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const result = JSON.parse(content.text)
        return {
          score: result.score,
          maxScore: request.maxPoints,
          feedback: result.feedback,
          confidence: result.confidence
        }
      }
    }
    
    throw new Error('Failed to get AI response')
  } catch (error) {
    console.error('AI grading error:', error)
    throw new Error('Failed to grade answer with AI')
  }
}

/**
 * Grade essay questions using AI (rubric-based)
 */
async function gradeEssay(request: GradingRequest): Promise<GradingResult> {
  if (!openai && !anthropic) {
    throw new Error('No AI provider configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
  }

  const rubricText = request.rubric 
    ? JSON.stringify(request.rubric, null, 2)
    : 'Standard essay rubric: thesis, evidence, organization, grammar'

  const prompt = `You are an expert teacher grading an essay question.

Question: ${request.questionContent}

Rubric:
${rubricText}

Maximum Points: ${request.maxPoints}

Student's Essay:
${request.studentResponse}

Grade the essay according to the rubric. Provide:
1. A fair score based on the rubric criteria
2. Specific, constructive feedback highlighting strengths and areas for improvement
3. Your confidence in this grading

Provide your response in this exact JSON format:
{
  "score": <number between 0 and ${request.maxPoints}>,
  "feedback": "<detailed feedback with specific examples from the essay>",
  "confidence": <number between 0 and 1>
}

Be encouraging but honest. Point out both strengths and weaknesses.`

  try {
    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: result.score,
        maxScore: request.maxPoints,
        feedback: result.feedback,
        confidence: result.confidence
      }
    } else if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const result = JSON.parse(content.text)
        return {
          score: result.score,
          maxScore: request.maxPoints,
          feedback: result.feedback,
          confidence: result.confidence
        }
      }
    }

    throw new Error('Failed to get AI response')
  } catch (error) {
    console.error('AI grading error:', error)
    throw new Error('Failed to grade essay with AI')
  }
}

/**
 * Grade code submissions
 */
async function gradeCode(request: GradingRequest): Promise<GradingResult> {
  if (!openai && !anthropic) {
    throw new Error('No AI provider configured.')
  }

  const prompt = `You are an expert programming instructor grading a coding assignment.

Problem: ${request.questionContent}

Student's Code:
\`\`\`
${request.studentResponse}
\`\`\`

Maximum Points: ${request.maxPoints}

Evaluate the code for:
1. Correctness - Does it solve the problem?
2. Code quality - Is it well-structured and readable?
3. Best practices - Does it follow good programming conventions?

Provide your response in this exact JSON format:
{
  "score": <number between 0 and ${request.maxPoints}>,
  "feedback": "<specific feedback on the code with suggestions for improvement>",
  "confidence": <number between 0 and 1>
}

Be constructive and educational in your feedback.`

  try {
    if (openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return {
        score: result.score,
        maxScore: request.maxPoints,
        feedback: result.feedback,
        confidence: result.confidence
      }
    } else if (anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })

      const content = response.content[0]
      if (content.type === 'text') {
        const result = JSON.parse(content.text)
        return {
          score: result.score,
          maxScore: request.maxPoints,
          feedback: result.feedback,
          confidence: result.confidence
        }
      }
    }

    throw new Error('Failed to get AI response')
  } catch (error) {
    console.error('AI grading error:', error)
    throw new Error('Failed to grade code with AI')
  }
}

/**
 * Batch grading - grade multiple answers at once (more efficient)
 */
export async function gradeMultipleAnswers(
  requests: GradingRequest[]
): Promise<GradingResult[]> {
  // For now, grade sequentially. In production, you might want to batch API calls
  const results: GradingResult[] = []
  
  for (const request of requests) {
    try {
      const result = await gradeAnswer(request)
      results.push(result)
    } catch (error) {
      console.error('Error grading answer:', error)
      results.push({
        score: 0,
        maxScore: request.maxPoints,
        feedback: 'Error grading this answer. Please review manually.',
        confidence: 0
      })
    }
  }
  
  return results
}
