import { gradeAnswer } from '@/lib/ai-grading'

export async function GET() {
  try {
    const shortAnswerResult = await gradeAnswer({
      questionType: 'SHORT_ANSWER',
      questionContent: 'What is photosynthesis?',
      studentResponse: 'Photosynthesis is when plants use sunlight to make food',
      correctAnswer: 'Photosynthesis is the process by which plants convert light energy into chemical energy',
      maxPoints: 5
    })

    const essayResult = await gradeAnswer({
      questionType: 'ESSAY',
      questionContent: 'Explain the water cycle',
      studentResponse: 'The water cycle is how water moves around Earth. First, the sun heats water and it evaporates into vapor. Then it rises up and forms clouds. When clouds get heavy, it rains. The rain goes into rivers and oceans and the cycle starts again.',
      rubric: {
        criteria: ['Clear explanation', 'Accurate science', 'Organization', 'Completeness']
      },
      maxPoints: 10
    })

    return Response.json({
      success: true,
      tests: [
        {
          type: 'Short Answer',
          question: 'What is photosynthesis?',
          result: shortAnswerResult
        },
        {
          type: 'Essay',
          question: 'Explain the water cycle',
          result: essayResult
        }
      ]
    })
  } catch (error: any) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
