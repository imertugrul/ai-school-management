/**
 * Migration: ParentStudent → Guardian
 *
 * Copies all existing ParentStudent records to the Guardian model.
 * Safe to run multiple times (skips duplicates by studentId+userId combo).
 *
 * Run with: npx tsx src/scripts/migrate-parents.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting ParentStudent → Guardian migration...')

  const links = await prisma.parentStudent.findMany({
    include: {
      parent:  { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true } },
    },
  })

  console.log(`Found ${links.length} existing ParentStudent record(s).`)

  let created = 0
  let skipped = 0

  for (const link of links) {
    // Skip if a Guardian with this studentId+userId already exists
    const exists = await prisma.guardian.findFirst({
      where: { studentId: link.studentId, userId: link.parentId },
    })

    if (exists) {
      console.log(`  SKIP  ${link.parent.name} → ${link.student.name} (already migrated)`)
      skipped++
      continue
    }

    // Map old English relationship labels to Turkish
    const relMap: Record<string, string> = {
      Mother:      'Anne',
      Father:      'Baba',
      Guardian:    'Vasi',
      Grandparent: 'Diğer',
      Other:       'Diğer',
    }
    const relationship = relMap[link.relationship] ?? link.relationship ?? 'Vasi'

    await prisma.guardian.create({
      data: {
        studentId:    link.studentId,
        name:         link.parent.name,
        email:        link.parent.email,
        relationship,
        isPrimary:    true,
        receivesEmail: true,
        userId:       link.parentId,
      },
    })

    console.log(`  OK    ${link.parent.name} → ${link.student.name} (${relationship})`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(e => { console.error('Migration error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
