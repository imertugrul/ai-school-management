# AI Grading System

An AI-powered grading and feedback system for middle and high school teachers. Save 10-15 hours per week on grading while providing personalized feedback to every student.

## Features (MVP - Phase 1)

- ✅ **Digital Test Creation**: Create tests with multiple choice, short answer, essay, and code questions
- ✅ **AI Grading Engine**: Automatic grading with personalized feedback
- ✅ **Multiple AI Providers**: Support for OpenAI (GPT-4) and Anthropic (Claude)
- ✅ **Teacher Review**: Review and override any AI grade
- ✅ **Student Dashboard**: Students can view their graded tests and feedback
- ✅ **Analytics**: Track class performance and identify common mistakes

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4 / Anthropic Claude
- **Authentication**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- OpenAI API key OR Anthropic API key

### Installation

1. **Clone and install dependencies**

```bash
cd ai-grading-app
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Database - Use your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/ai_grading"

# Authentication - Generate a random secret
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret-here"

# AI Provider - Add at least one
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."
```

3. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed with sample data
npx prisma db seed
```

4. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
ai-grading-app/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx           # Homepage
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   └── lib/
│       ├── prisma.ts          # Database client
│       └── ai-grading.ts      # AI grading service
├── public/                    # Static files
├── .env                       # Environment variables (not in git)
├── .env.example              # Environment template
└── package.json              # Dependencies
```

## Database Schema

Key tables:
- **User**: Teachers and students
- **Test**: Tests created by teachers
- **Question**: Individual questions in tests
- **Submission**: Student attempts at tests
- **Answer**: Individual answers with AI grading results

## AI Grading

The system supports multiple question types:

1. **Multiple Choice**: Exact match grading (instant)
2. **Short Answer**: Semantic matching with GPT-3.5/Claude Haiku (cost-efficient)
3. **Essay**: Rubric-based grading with GPT-4/Claude Sonnet (detailed feedback)
4. **Code**: Syntax and logic evaluation with GPT-4/Claude Sonnet

### Cost Estimates

- Multiple choice: $0 (no AI needed)
- Short answer: ~$0.01-0.05 per answer
- Essay: ~$0.10-0.30 per essay
- Code: ~$0.15-0.40 per submission

## Development Roadmap

### ✅ Phase 1: Foundation (Current)
- Basic test creation interface
- AI grading engine
- Student test-taking interface
- Teacher review dashboard

### 🚧 Phase 2: Enhancements (Next)
- Question bank (save/reuse questions)
- Batch grading improvements
- Advanced analytics
- Export to CSV/gradebook

### 📋 Phase 3: Paper Tests (Future)
- Scanned test upload
- OCR integration (Google Cloud Vision)
- Handwriting recognition
- Manual correction interface

### 🎯 Phase 4: Platform Expansion (Future)
- Parent communication tools
- LMS integration (Canvas, Google Classroom)
- Mobile app
- Lesson planning assistance

## Contributing

This is a solo project built by a CS teacher. Feedback and suggestions are welcome!

## License

Private - All rights reserved

## Support

For questions or issues, contact: [your-email]

---

**Built by a teacher, for teachers** 🍎
