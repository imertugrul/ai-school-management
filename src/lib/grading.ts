import { openai } from './openai'

interface GradingResult {
  score: number
  maxScore: number
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
  },
  studentAnswer: string
): Promise<GradingResult> {
  
  // Multiple Choice - Exact match
  if (question.type === 'MULTIPLE_CHOICE') {
    const isCorrect = studentAnswer.trim() === question.correctAnswer?.trim()
    return {
      score: isCorrect ? question.points : 0,
      maxScore: question.points,
      feedback: isCorrect 
        ? 'Correct!' 
        : `Incorrect. The correct answer is: ${question.correctAnswer}`,
      confidence: 1.0
    }
  }

  // Short Answer - Use AI
  if (question.type === 'SHORT_ANSWER') {
    try {
      const prompt = `
You are grading a short answer question.

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
}
`

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
        confidence: result.confidence || 0.8
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return {
        score: 0,
        maxScore: question.points,
        feedback: 'Error grading this answer. Please review manually.',
        confidence: 0
      }
    }
  }

  // Essay - Use AI with rubric
  if (question.type === 'ESSAY') {
    try {
      const rubricText = question.rubric 
        ? `Grading Rubric: ${JSON.stringify(question.rubric)}`
        : 'Use standard essay grading criteria: clarity, organization, evidence, grammar.'

      const prompt = `
You are grading an essay question.

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
}
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        score: Math.min(result.score || 0, question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Graded by AI',
        confidence: result.confidence || 0.7
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return {
        score: 0,
        maxScore: question.points,
        feedback: 'Error grading this essay. Please review manually.',
        confidence: 0
      }
    }
  }

  // Code - Use AI
  if (question.type === 'CODE') {
    try {
      const prompt = `
You are grading a coding question.

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
}
`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        score: Math.min(result.score || 0, question.points),
        maxScore: question.points,
        feedback: result.feedback || 'Graded by AI',
        confidence: result.confidence || 0.7
      }
    } catch (error) {
      console.error('AI grading error:', error)
      return {
        score: 0,
        maxScore: question.points,
        feedback: 'Error grading this code. Please review manually.',
        confidence: 0
      }
    }
  }

  // Fallback
  return {
    score: 0,
    maxScore: question.points,
    feedback: 'Unable to grade this question type automatically.',
    confidence: 0
  }
}
