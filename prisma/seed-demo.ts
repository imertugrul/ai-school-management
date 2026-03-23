// prisma/seed-demo.ts
// Run: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-demo.ts

import { PrismaClient, QuestionType, SubmissionStatus, GradeType, CurriculumType, Priority } from "@prisma/client";

const prisma = new PrismaClient();

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(1));
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomAccessCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function main() {
  console.log("🌱 Starting demo seed...\n");

  // ── 1. Find School ──────────────────────────────────────────────────────────
  const school = await prisma.school.findFirst();
  if (!school) throw new Error("No school found. Please create a school first.");
  console.log(`✅ School: ${school.name}`);

  // ── 2. Fetch existing users ─────────────────────────────────────────────────
  const teachers = await prisma.user.findMany({ where: { role: "TEACHER", schoolId: school.id } });
  const students = await prisma.user.findMany({
    where: { role: "STUDENT", schoolId: school.id },
    include: { class: true },
  });
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", schoolId: school.id } });

  console.log(`✅ Found ${teachers.length} teachers, ${students.length} students`);

  // ── 3. Fetch courses & classes ──────────────────────────────────────────────
  const courses = await prisma.course.findMany({ where: { schoolId: school.id } });
  const classes = await prisma.class.findMany({ where: { schoolId: school.id } });
  console.log(`✅ Found ${courses.length} courses, ${classes.length} classes\n`);

  // ── 4. Subject → course prefix map ─────────────────────────────────────────
  const subjectPrefix: Record<string, string> = {
    Mathematics: "MATH",
    Literature: "LIT",
    Physics: "PHYS",
    Chemistry: "CHEM",
    Biology: "BIO",
    History: "HIST",
    Geography: "GEO",
    English: "ENG",
    Philosophy: "PHIL",
    "Physical Education": "PE",
  };

  // ── 5. Course Assignments ───────────────────────────────────────────────────
  console.log("📚 Creating course assignments...");
  let caCount = 0;

  for (const teacher of teachers) {
    const prefix = subjectPrefix[teacher.subject || ""] || "";
    const teacherCourses = courses.filter((c) => c.code.startsWith(prefix));

    for (const course of teacherCourses) {
      const matchingClasses = classes.filter((cl) => cl.grade === course.grade);
      for (const cls of matchingClasses) {
        const exists = await prisma.courseAssignment.findFirst({
          where: { courseId: course.id, teacherId: teacher.id, classId: cls.id },
        });
        if (!exists) {
          await prisma.courseAssignment.create({
            data: { courseId: course.id, teacherId: teacher.id, classId: cls.id, weeklyHours: course.weeklyHours, isScheduled: true },
          });
          caCount++;
        }
      }
    }
  }
  console.log(`  ✅ ${caCount} course assignments`);

  // ── 6. Enrollments ──────────────────────────────────────────────────────────
  console.log("📝 Creating enrollments...");
  let enrollCount = 0;

  for (const student of students) {
    const grade = student.class?.grade;
    if (!grade) continue;
    const gradeCourses = courses.filter((c) => c.grade === grade);
    for (const course of gradeCourses) {
      const exists = await prisma.enrollment.findFirst({ where: { courseId: course.id, studentId: student.id } });
      if (!exists) {
        await prisma.enrollment.create({ data: { courseId: course.id, studentId: student.id, status: "ACTIVE" } });
        enrollCount++;
      }
    }
  }
  console.log(`  ✅ ${enrollCount} enrollments`);

  // ── 7. Schedule ─────────────────────────────────────────────────────────────
  console.log("📅 Creating schedule...");
  let schedCount = 0;

  const slots = [
    { s: "08:00", e: "08:45" }, { s: "08:55", e: "09:40" },
    { s: "09:50", e: "10:35" }, { s: "10:45", e: "11:30" },
    { s: "11:40", e: "12:25" }, { s: "13:15", e: "14:00" },
    { s: "14:10", e: "14:55" }, { s: "15:05", e: "15:50" },
  ];
  const rooms = ["A101", "A102", "B201", "B202", "C301", "Lab1", "Lab2", "Gym"];

  for (const teacher of teachers) {
    const prefix = subjectPrefix[teacher.subject || ""] || "";
    const teacherCourses = courses.filter((c) => c.code.startsWith(prefix));
    let idx = teachers.indexOf(teacher) * 3;

    for (const course of teacherCourses) {
      const matchingClasses = classes.filter((cl) => cl.grade === course.grade);
      for (const cls of matchingClasses) {
        const day = idx % 5;
        const slot = slots[idx % slots.length];
        const exists = await prisma.schedule.findFirst({ where: { teacherId: teacher.id, dayOfWeek: day, startTime: slot.s } });
        if (!exists) {
          await prisma.schedule.create({
            data: { courseId: course.id, teacherId: teacher.id, classId: cls.id, dayOfWeek: day, startTime: slot.s, endTime: slot.e, room: rooms[schedCount % rooms.length], isActive: true },
          });
          schedCount++;
        }
        idx++;
      }
    }
  }
  console.log(`  ✅ ${schedCount} schedule slots`);

  // ── 8. Grade Components + Grades ───────────────────────────────────────────
  console.log("📊 Creating grades...");
  let gradeCount = 0;

  const componentDefs = [
    { name: "Midterm Exam",  type: GradeType.EXAM,          weight: 0.30, maxScore: 100, daysBack: 60 },
    { name: "Final Exam",    type: GradeType.EXAM,          weight: 0.35, maxScore: 100, daysBack: 14 },
    { name: "Quiz Average",  type: GradeType.QUIZ,          weight: 0.15, maxScore: 100, daysBack: 30 },
    { name: "Homework",      type: GradeType.HOMEWORK,      weight: 0.10, maxScore: 100, daysBack: 7  },
    { name: "Participation", type: GradeType.PARTICIPATION, weight: 0.10, maxScore: 100, daysBack: 3  },
  ];

  for (const course of courses) {
    const existing = await prisma.gradeComponent.count({ where: { courseId: course.id } });
    if (existing > 0) continue;

    const components = await Promise.all(
      componentDefs.map((d) =>
        prisma.gradeComponent.create({
          data: { courseId: course.id, name: d.name, type: d.type, weight: d.weight, maxScore: d.maxScore, date: daysAgo(d.daysBack) },
        })
      )
    );

    const enrolled = await prisma.enrollment.findMany({ where: { courseId: course.id } });

    for (const en of enrolled) {
      // Assign each student a consistent performance tier
      const tier = Math.random();

      for (const comp of components) {
        let base: number;
        if (tier > 0.85) base = rand(90, 100);
        else if (tier > 0.60) base = rand(78, 90);
        else if (tier > 0.35) base = rand(65, 78);
        else if (tier > 0.15) base = rand(55, 65);
        else base = rand(40, 55);

        // Small per-component variance
        const variance = rand(-5, 5);
        const score = Math.max(0, Math.min(100, base + variance));

        const existsGrade = await prisma.grade.findFirst({ where: { componentId: comp.id, studentId: en.studentId } });
        if (!existsGrade) {
          await prisma.grade.create({
            data: {
              componentId: comp.id,
              studentId: en.studentId,
              score: parseFloat(score.toFixed(1)),
              feedback: score >= 90 ? "Excellent work!" : score >= 75 ? "Good effort, keep it up." : score >= 60 ? "Passing, room for improvement." : "Needs improvement. Please see me after class.",
            },
          });
          gradeCount++;
        }
      }
    }
  }
  console.log(`  ✅ ${gradeCount} grade entries`);

  // ── 9. Lesson Plans ─────────────────────────────────────────────────────────
  console.log("📋 Creating lesson plans...");
  let lpCount = 0;

  const lessonData: Record<string, { unitName: string; title: string; objectives: string[]; materials: string[]; slideOutline: object[] }[]> = {
    MATH: [
      {
        unitName: "Quadratic Equations",
        title: "Graphing Parabolas & Finding Vertices",
        objectives: ["Identify quadratic functions in standard form", "Graph parabolas using key features", "Solve by factoring"],
        materials: ["Graphing calculators", "Graph paper", "TI-84 emulator"],
        slideOutline: [
          { section: "Warm-Up", duration: 5, content: "Review linear functions" },
          { section: "Direct Instruction", duration: 15, content: "Introduce ax²+bx+c form" },
          { section: "Guided Practice", duration: 15, content: "Graph 3 parabolas together" },
          { section: "Independent Practice", duration: 8, content: "Worksheet problems" },
          { section: "Exit Ticket", duration: 2, content: "Identify vertex and axis of symmetry" },
        ],
      },
      {
        unitName: "Trigonometry Basics",
        title: "Sine, Cosine & the Unit Circle",
        objectives: ["Understand the unit circle", "Calculate trig values for standard angles", "Apply ratios to right triangles"],
        materials: ["Unit circle handout", "Scientific calculators", "Protractors"],
        slideOutline: [
          { section: "Review", duration: 5, content: "Pythagorean theorem recap" },
          { section: "New Concept", duration: 20, content: "Unit circle and angle measures" },
          { section: "Practice", duration: 15, content: "Calculating trig values" },
          { section: "Closure", duration: 5, content: "Real-world application examples" },
        ],
      },
    ],
    LIT: [
      {
        unitName: "Short Story Analysis",
        title: "Character Development & Conflict Types",
        objectives: ["Identify protagonist and antagonist", "Analyze internal vs external conflict", "Write a character analysis paragraph"],
        materials: ["Printed story handouts", "Annotation guide", "Discussion prompts"],
        slideOutline: [
          { section: "Hook", duration: 5, content: "Short story read-aloud" },
          { section: "Vocabulary", duration: 10, content: "Literary terms review" },
          { section: "Analysis", duration: 20, content: "Group annotation activity" },
          { section: "Writing", duration: 8, content: "Character analysis paragraph" },
          { section: "Share Out", duration: 2, content: "Pair share conclusions" },
        ],
      },
    ],
    PHYS: [
      {
        unitName: "Newton's Laws of Motion",
        title: "Forces, Mass & Acceleration (F=ma)",
        objectives: ["State Newton's three laws of motion", "Apply F=ma to solve force problems", "Design an experiment to demonstrate inertia"],
        materials: ["Spring scales", "Toy cars", "Ramps", "Stopwatches"],
        slideOutline: [
          { section: "Demo", duration: 8, content: "Tablecloth inertia demonstration" },
          { section: "Notes", duration: 15, content: "Three laws with examples" },
          { section: "Problem Solving", duration: 15, content: "F=ma calculations" },
          { section: "Lab Setup", duration: 5, content: "Introduce next class lab" },
          { section: "Recap", duration: 2, content: "3-2-1 exit strategy" },
        ],
      },
    ],
    ENG: [
      {
        unitName: "Argumentative Writing",
        title: "Writing Strong Thesis Statements",
        objectives: ["Write a clear, arguable thesis statement", "Identify strong vs weak thesis examples", "Outline a 5-paragraph essay"],
        materials: ["Sample essays", "Thesis formula worksheet", "Peer review rubric"],
        slideOutline: [
          { section: "Mentor Text", duration: 10, content: "Read and analyze example essay" },
          { section: "Mini Lesson", duration: 15, content: "Thesis formula instruction" },
          { section: "Practice", duration: 12, content: "Rewrite weak thesis statements" },
          { section: "Drafting", duration: 6, content: "Write own thesis for chosen topic" },
          { section: "Feedback", duration: 2, content: "Partner feedback protocol" },
        ],
      },
    ],
    CHEM: [
      {
        unitName: "Periodic Table",
        title: "Trends in the Periodic Table",
        objectives: ["Identify periodic trends (atomic radius, electronegativity)", "Explain why trends exist", "Apply trends to predict element properties"],
        materials: ["Periodic table posters", "Colored markers", "Element cards"],
        slideOutline: [
          { section: "Intro", duration: 5, content: "What patterns do you notice?" },
          { section: "Lecture", duration: 20, content: "Four main periodic trends" },
          { section: "Activity", duration: 15, content: "Color-coding periodic table" },
          { section: "Application", duration: 5, content: "Predict unknown element properties" },
        ],
      },
    ],
    BIO: [
      {
        unitName: "Cell Biology",
        title: "Mitosis: Cell Division Step by Step",
        objectives: ["Name and describe the stages of mitosis", "Explain the importance of cell division", "Identify stages under a microscope"],
        materials: ["Microscopes", "Onion root tip slides", "Cell division diagrams"],
        slideOutline: [
          { section: "Hook", duration: 5, content: "Why do cells divide?" },
          { section: "Stages", duration: 20, content: "PMAT stages with animations" },
          { section: "Lab", duration: 15, content: "View slides, identify stages" },
          { section: "Debrief", duration: 5, content: "Class discussion of findings" },
        ],
      },
    ],
  };

  const subjectTeacherPairs = [
    { prefix: "MATH", teacher: teachers.find((t) => t.subject === "Mathematics") },
    { prefix: "LIT",  teacher: teachers.find((t) => t.subject === "Literature") },
    { prefix: "PHYS", teacher: teachers.find((t) => t.subject === "Physics") },
    { prefix: "ENG",  teacher: teachers.find((t) => t.subject === "English") },
    { prefix: "CHEM", teacher: teachers.find((t) => t.subject === "Chemistry") },
    { prefix: "BIO",  teacher: teachers.find((t) => t.subject === "Biology") },
  ];

  for (const { prefix, teacher } of subjectTeacherPairs) {
    if (!teacher) continue;
    const templates = lessonData[prefix];
    if (!templates) continue;

    const teacherCourses = courses.filter((c) => c.code.startsWith(prefix));

    for (const course of teacherCourses) {
      const matchingClass = classes.find((cl) => cl.grade === course.grade);
      const tmpl = templates[rand(0, templates.length - 1)];

      // AI-generated plan
      await prisma.lessonPlan.create({
        data: {
          teacherId: teacher.id,
          courseId: course.id,
          classId: matchingClass?.id,
          schoolId: school.id,
          title: tmpl.title,
          date: daysAgo(rand(3, 25)),
          objectives: tmpl.objectives.join("\n"),
          materials: "",
          activities: "See AI-generated content below",
          isAIGenerated: true,
          wasEdited: Math.random() > 0.6,
          curriculumType: CurriculumType.NATIONAL,
          unitName: tmpl.unitName,
          learningObjectives: JSON.stringify(tmpl.objectives),
          materialsNeeded: JSON.stringify(tmpl.materials),
          slideOutline: JSON.stringify(tmpl.slideOutline),
          aiActivities: JSON.stringify([
            { title: "Think-Pair-Share", duration: 10, grouping: "pairs", description: "Students discuss key concepts with a partner before sharing with the class." },
            { title: "Guided Practice", duration: 15, grouping: "individual", description: "Teacher-led problem solving with student participation." },
            { title: "Group Challenge", duration: 12, grouping: "groups", description: "Small groups tackle a challenging extension problem." },
          ]),
          aiAssessment: JSON.stringify({
            formative: ["Exit ticket", "Mini whiteboard check-ins", "Think-pair-share observations"],
            summative: "End-of-unit test",
            exitTicket: "Students complete 2 problems independently before leaving.",
          }),
          duration: 45,
        },
      });

      // Manual plan for variety
      if (rand(0, 1) === 1) {
        await prisma.lessonPlan.create({
          data: {
            teacherId: teacher.id,
            courseId: course.id,
            classId: matchingClass?.id,
            schoolId: school.id,
            title: `${tmpl.unitName} — Review & Practice`,
            date: daysAgo(rand(26, 55)),
            objectives: "Review key concepts and reinforce understanding through practice exercises.",
            materials: "Textbook, practice worksheets, board work",
            activities: "1. Warm-up review (5 min)\n2. Homework discussion (10 min)\n3. Practice problems (20 min)\n4. Exit ticket (5 min)",
            assessment: "Exit ticket with 3 practice problems",
            homework: "Complete exercises from textbook — 10 problems",
            notes: "Pair struggling students with stronger peers for practice section.",
            isAIGenerated: false,
            wasEdited: false,
            duration: 45,
          },
        });
      }
      lpCount++;
    }
  }
  console.log(`  ✅ ~${lpCount * 2} lesson plans created`);

  // ── 10. Tests + Submissions ─────────────────────────────────────────────────
  console.log("📝 Creating tests and submissions...");
  let testCount = 0;
  let subCount = 0;

  const testDefs = [
    {
      prefix: "MATH",
      title: "Algebra & Functions Quiz",
      subject: "Mathematics",
      questions: [
        { type: QuestionType.MULTIPLE_CHOICE, content: "What is the solution to 2x + 6 = 14?", options: ["x = 3", "x = 4", "x = 5", "x = 10"], correct: "x = 4", points: 10 },
        { type: QuestionType.TRUE_FALSE, content: "The graph of y = x² is a parabola that opens upward.", options: ["True", "False"], correct: "True", points: 10 },
        { type: QuestionType.SHORT_ANSWER, content: "What is the vertex form of a quadratic equation?", correct: "y = a(x-h)² + k", points: 15 },
        { type: QuestionType.ESSAY, content: "Explain the relationship between the discriminant and the number of real roots of a quadratic equation. Give examples for each case.", correct: null, points: 40, rubric: { criteria: [{ name: "Accuracy", points: 15 }, { name: "Examples", points: 15 }, { name: "Clarity", points: 10 }] } },
        { type: QuestionType.MULTIPLE_CHOICE, content: "Which is NOT a method for solving quadratic equations?", options: ["Factoring", "Quadratic formula", "Completing the square", "Long division"], correct: "Long division", points: 10 },
      ],
    },
    {
      prefix: "ENG",
      title: "Essay Writing Assessment",
      subject: "English",
      questions: [
        { type: QuestionType.MULTIPLE_CHOICE, content: "What is the main purpose of a thesis statement?", options: ["Summarize the essay", "State the central argument", "Introduce background info", "List evidence"], correct: "State the central argument", points: 10 },
        { type: QuestionType.TRUE_FALSE, content: "A topic sentence should always appear at the end of a paragraph.", options: ["True", "False"], correct: "False", points: 10 },
        { type: QuestionType.SHORT_ANSWER, content: "Name two types of context clues that help readers determine word meanings.", correct: "definition, example, contrast, inference", points: 15 },
        { type: QuestionType.ESSAY, content: "Write an argumentative paragraph (5-7 sentences) about why reading regularly benefits students. Include a topic sentence, two supporting details, and a conclusion.", correct: null, points: 40, rubric: { criteria: [{ name: "Topic Sentence", points: 10 }, { name: "Supporting Details", points: 15 }, { name: "Conclusion", points: 10 }, { name: "Grammar", points: 5 }] } },
        { type: QuestionType.FILL_TEXT, content: "A ___ is a group of sentences discussing one main idea. The first sentence is usually the ___ sentence.", correct: "paragraph, topic", points: 10 },
      ],
    },
    {
      prefix: "PHYS",
      title: "Forces & Motion Unit Test",
      subject: "Physics",
      questions: [
        { type: QuestionType.MULTIPLE_CHOICE, content: "Which law states that an object stays in motion unless acted on by an external force?", options: ["First Law", "Second Law", "Third Law", "Fourth Law"], correct: "First Law", points: 10 },
        { type: QuestionType.MULTIPLE_CHOICE, content: "A 10 kg object accelerates at 5 m/s². What is the net force?", options: ["2 N", "15 N", "50 N", "100 N"], correct: "50 N", points: 15 },
        { type: QuestionType.TRUE_FALSE, content: "For every action there is an equal and opposite reaction.", options: ["True", "False"], correct: "True", points: 10 },
        { type: QuestionType.SHORT_ANSWER, content: "What is the SI unit of force?", correct: "Newton", points: 10 },
        { type: QuestionType.ESSAY, content: "Describe an everyday example of Newton's Third Law. Identify the action and reaction forces and explain why they don't cancel each other out.", correct: null, points: 40, rubric: { criteria: [{ name: "Example", points: 10 }, { name: "Force Identification", points: 15 }, { name: "Explanation", points: 15 }] } },
      ],
    },
  ];

  const essayAnswers = {
    MATH: {
      good: "The discriminant (b²-4ac) determines the nature of roots. When positive, the equation has two distinct real roots — e.g. x²-5x+6=0 has discriminant 1>0, giving x=2 and x=3. When zero, there is exactly one repeated root — e.g. x²-4x+4=0 gives x=2. When negative, there are no real roots — e.g. x²+x+1=0 has discriminant -3<0, producing only complex solutions.",
      avg: "The discriminant b²-4ac tells us how many solutions a quadratic has. Positive = 2 real roots, zero = 1 root, negative = no real roots. For x²-4x+4 discriminant is 0 so x=2 is the only root.",
      poor: "The discriminant is part of the quadratic formula. I think if its positive you get real roots. I'm not totally sure about the other cases.",
    },
    ENG: {
      good: "Reading regularly offers students significant academic advantages. First, consistent reading expands vocabulary naturally, as readers encounter new words in meaningful contexts and internalize their meanings. Second, regular reading strengthens critical thinking skills — students learn to analyze arguments, evaluate evidence, and identify themes across texts. Research consistently shows that students who read for pleasure score higher on standardized assessments across all subjects. In conclusion, establishing a daily reading habit is one of the most powerful investments a student can make in their academic development.",
      avg: "Reading is beneficial for students because it builds vocabulary and helps with writing skills. When students read regularly they learn new words and ideas. Also reading helps your brain stay active and focused. Students who read more generally get better grades in school. I think reading even 20 minutes a day can make a real difference.",
      poor: "Reading is good for students. It helps you learn things and be smarter. Books are nice. That is why reading is beneficial.",
    },
    PHYS: {
      good: "A rocket launch demonstrates Newton's Third Law clearly. The engine expels exhaust gas downward (action force). The gas in turn exerts an equal force pushing the rocket upward (reaction force). These forces do not cancel because they act on different objects — the action acts on the exhaust gas while the reaction acts on the rocket. Forces only cancel when they act on the same object; since these act on different objects, the net result is the rocket accelerating upward.",
      avg: "When you push against a wall, the wall pushes back on you with equal force. The action is your push and the reaction is the wall pushing back. They don't cancel because one force is on you and one is on the wall.",
      poor: "Newton's third law says action and reaction are equal. Like when a ball bounces. I think the forces cancel somehow but the object still moves.",
    },
  };

  for (const def of testDefs) {
    const teacher = teachers.find((t) => (subjectPrefix[t.subject || ""] || "") === def.prefix);
    if (!teacher) continue;

    const teacherCourses = courses.filter((c) => c.code.startsWith(def.prefix)).slice(0, 2);

    for (const course of teacherCourses) {
      const test = await prisma.test.create({
        data: {
          title: `${def.title} — Grade ${course.grade}`,
          subject: def.subject,
          description: `Assessment for ${course.name}`,
          isPublished: true,
          isActive: false,
          accessCode: randomAccessCode(),
          createdById: teacher.id,
          startDate: daysAgo(14),
          endDate: daysAgo(7),
        },
      });

      const questions = await Promise.all(
        def.questions.map((q, i) =>
          prisma.question.create({
            data: {
              testId: test.id,
              type: q.type,
              content: q.content,
              options: q.options || undefined,
              correctAnswer: q.correct,
              rubric: (q as any).rubric || undefined,
              points: q.points,
              orderIndex: i,
            },
          })
        )
      );

      testCount++;

      const enrolled = await prisma.enrollment.findMany({ where: { courseId: course.id } });
      const maxScore = questions.reduce((s, q) => s + q.points, 0);

      for (const en of enrolled) {
        const perfRoll = Math.random();
        const tier = perfRoll > 0.65 ? "good" : perfRoll > 0.30 ? "avg" : "poor";

        const submission = await prisma.submission.create({
          data: { studentId: en.studentId, testId: test.id, status: SubmissionStatus.RELEASED, startedAt: daysAgo(14), submittedAt: daysAgo(14), aiGraded: true, totalScore: 0, maxScore },
        });

        let totalScore = 0;

        for (const question of questions) {
          let response = "";
          let aiScore = 0;
          let aiFeedback = "";
          const aiConfidence = randFloat(0.80, 0.98);

          const correctRate = tier === "good" ? 0.88 : tier === "avg" ? 0.58 : 0.30;

          if (question.type === QuestionType.MULTIPLE_CHOICE) {
            const isCorrect = Math.random() < correctRate;
            const opts = question.options as string[];
            response = isCorrect ? question.correctAnswer! : opts.find((o) => o !== question.correctAnswer) || opts[0];
            aiScore = response === question.correctAnswer ? question.points : 0;
            aiFeedback = aiScore > 0 ? "Correct!" : `Incorrect. The correct answer is: ${question.correctAnswer}`;
          } else if (question.type === QuestionType.TRUE_FALSE) {
            const isCorrect = Math.random() < correctRate;
            response = isCorrect ? question.correctAnswer! : question.correctAnswer === "True" ? "False" : "True";
            aiScore = response === question.correctAnswer ? question.points : 0;
            aiFeedback = aiScore > 0 ? "Correct!" : `Incorrect. The answer is ${question.correctAnswer}.`;
          } else if (question.type === QuestionType.SHORT_ANSWER) {
            const isCorrect = Math.random() < correctRate;
            response = isCorrect ? question.correctAnswer! : "I'm not certain about this.";
            aiScore = isCorrect ? question.points : rand(0, Math.floor(question.points * 0.4));
            aiFeedback = isCorrect ? "Correct!" : `Partially correct. Expected keywords: ${question.correctAnswer}`;
          } else if (question.type === QuestionType.FILL_TEXT) {
            response = tier === "good" ? "paragraph, topic" : tier === "avg" ? "paragraph, sentence" : "section, main";
            aiScore = tier === "good" ? question.points : tier === "avg" ? Math.floor(question.points * 0.6) : Math.floor(question.points * 0.2);
            aiFeedback = tier === "good" ? "Both blanks correct!" : "One or more blanks incorrect.";
          } else if (question.type === QuestionType.ESSAY) {
            const ea = essayAnswers[def.prefix as keyof typeof essayAnswers];
            response = ea[tier as keyof typeof ea];
            const pct = tier === "good" ? randFloat(0.83, 0.97) : tier === "avg" ? randFloat(0.58, 0.80) : randFloat(0.25, 0.52);
            aiScore = parseFloat((question.points * pct).toFixed(1));
            aiFeedback =
              tier === "good"
                ? "Excellent response. Strong use of examples and clear, organized explanation. Demonstrates thorough understanding."
                : tier === "avg"
                ? "Good attempt. Correct main idea but could benefit from more specific examples and deeper analysis."
                : "Shows basic understanding but lacks detail and examples. Please review the material and try to connect concepts to real-world applications.";
          }

          await prisma.answer.create({
            data: { submissionId: submission.id, questionId: question.id, response, aiScore, aiFeedback, aiConfidence, teacherScore: aiScore, teacherFeedback: null },
          });

          totalScore += aiScore;
        }

        await prisma.submission.update({ where: { id: submission.id }, data: { totalScore: parseFloat(totalScore.toFixed(1)) } });
        subCount++;
      }
    }
  }
  console.log(`  ✅ ${testCount} tests, ${subCount} submissions (AI graded & released)`);

  // ── 11. Announcements ───────────────────────────────────────────────────────
  console.log("📢 Creating announcements...");

  if (admin) {
    const annList = [
      { title: "End of Term Exam Schedule Published", content: "The end of term examination schedule has been published. Please check carefully and ensure your students are aware of their exam dates and rooms. All exams take place in the main hall unless otherwise specified.", priority: Priority.HIGH, category: "Academic", targetRoles: ["TEACHER", "STUDENT"] },
      { title: "Parent-Teacher Meeting — April 15", content: "Spring semester parent-teacher meetings are scheduled for April 15th from 14:00–17:00. All teachers must be present. Please prepare grade reports and student progress summaries in advance.", priority: Priority.MEDIUM, category: "Meeting", targetRoles: ["TEACHER"] },
      { title: "Science Fair Registration Now Open", content: "Registration for the Annual Science Fair is open. Students in grades 9-12 can register teams of 2-3 by April 5th. Projects will be displayed on April 20th, with top projects nominated for the regional competition.", priority: Priority.MEDIUM, category: "Event", targetRoles: ["STUDENT", "TEACHER"] },
      { title: "Reminder: Weekly Lesson Plans Due Friday", content: "All teachers are reminded to submit weekly lesson plans by Friday at 17:00. Plans must include learning objectives, materials, activities, and assessment strategies.", priority: Priority.URGENT, category: "Administrative", targetRoles: ["TEACHER"] },
    ];

    for (const a of annList) {
      await prisma.announcement.create({
        data: { ...a, authorId: admin.id, schoolId: school.id, publishedAt: daysAgo(rand(1, 10)), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }
    console.log(`  ✅ ${annList.length} announcements`);
  }

  // ── 12. Events ──────────────────────────────────────────────────────────────
  console.log("📅 Creating events...");

  if (admin) {
    const eventList = [
      { title: "Science Fair", description: "Annual school science fair for grades 9-12. Students present projects to a panel of judges.", location: "School Gymnasium", startDate: new Date(Date.now() + 27 * 86400000), endDate: new Date(Date.now() + 27 * 86400000 + 6 * 3600000), category: "Academic", color: "#3B82F6", targetRoles: ["STUDENT", "TEACHER", "ADMIN"] },
      { title: "Parent-Teacher Meeting", description: "Spring semester meetings. Teachers meet parents to discuss student progress.", location: "Classrooms", startDate: new Date(Date.now() + 22 * 86400000), endDate: new Date(Date.now() + 22 * 86400000 + 3 * 3600000), category: "Meeting", color: "#8B5CF6", targetRoles: ["TEACHER", "ADMIN"] },
      { title: "Spring Sports Day", description: "Annual sports day with track and field events, team sports, and activities for all students.", location: "Sports Field", startDate: new Date(Date.now() + 35 * 86400000), endDate: new Date(Date.now() + 35 * 86400000 + 8 * 3600000), category: "Sports", color: "#10B981", isAllDay: true, targetRoles: ["STUDENT", "TEACHER", "ADMIN"] },
      { title: "End of Year Ceremony", description: "Celebration of the academic year with student achievements, awards, and 12th grade graduation.", location: "School Auditorium", startDate: new Date(Date.now() + 60 * 86400000), endDate: new Date(Date.now() + 60 * 86400000 + 4 * 3600000), category: "Ceremony", color: "#F59E0B", targetRoles: ["STUDENT", "TEACHER", "ADMIN"] },
    ];

    for (const ev of eventList) {
      await prisma.event.create({
        data: { ...ev, isAllDay: (ev as any).isAllDay || false, organizerId: admin.id, schoolId: school.id },
      });
    }
    console.log(`  ✅ ${eventList.length} events`);
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n✨ Demo seed complete!\n");
  console.log("📊 Summary:");
  console.log(`   👩‍🏫 ${teachers.length} teachers`);
  console.log(`   👨‍🎓 ${students.length} students across ${classes.length} classes`);
  console.log(`   📚 ${courses.length} courses`);
  console.log(`   📅 ${schedCount} schedule slots (Mon–Fri)`);
  console.log(`   📊 ${gradeCount} grade entries (5 components per course)`);
  console.log(`   📋 ~${lpCount * 2} lesson plans (AI + manual)`);
  console.log(`   📝 ${testCount} tests with ${subCount} AI-graded submissions`);
  console.log(`   📢 Announcements & events populated`);
  console.log("\n🎯 System is ready for demo!\n");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
