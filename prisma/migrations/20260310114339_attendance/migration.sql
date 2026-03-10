/*
  Warnings:

  - The values [TRUE_FALSE] on the enum `QuestionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `teacherReviewed` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `fileUrl` on the `ScannedTest` table. All the data in the column will be lost.
  - You are about to drop the column `ocrResults` on the `ScannedTest` table. All the data in the column will be lost.
  - You are about to drop the column `ocrStatus` on the `ScannedTest` table. All the data in the column will be lost.
  - You are about to drop the column `suspiciousActivity` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `teacherReviewed` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `timeLimit` on the `Test` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[schoolId,name]` on the table `Class` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `School` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,testId]` on the table `Submission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imageUrl` to the `ScannedTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `School` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Test` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QuestionType_new" AS ENUM ('MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'CODE');
ALTER TABLE "Question" ALTER COLUMN "type" TYPE "QuestionType_new" USING ("type"::text::"QuestionType_new");
ALTER TYPE "QuestionType" RENAME TO "QuestionType_old";
ALTER TYPE "QuestionType_new" RENAME TO "QuestionType";
DROP TYPE "QuestionType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PARENT';

-- DropForeignKey
ALTER TABLE "Answer" DROP CONSTRAINT "Answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Submission" DROP CONSTRAINT "Submission_testId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Test" DROP CONSTRAINT "Test_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "TestAssignment" DROP CONSTRAINT "TestAssignment_assignedBy_fkey";

-- DropIndex
DROP INDEX "Answer_questionId_idx";

-- DropIndex
DROP INDEX "Answer_submissionId_idx";

-- DropIndex
DROP INDEX "Class_schoolId_idx";

-- DropIndex
DROP INDEX "Question_testId_idx";

-- DropIndex
DROP INDEX "ScannedTest_studentId_idx";

-- DropIndex
DROP INDEX "ScannedTest_testId_idx";

-- DropIndex
DROP INDEX "Submission_studentId_idx";

-- DropIndex
DROP INDEX "Submission_testId_idx";

-- DropIndex
DROP INDEX "Submission_testId_studentId_key";

-- DropIndex
DROP INDEX "Test_schoolId_idx";

-- DropIndex
DROP INDEX "Test_teacherId_idx";

-- DropIndex
DROP INDEX "TestAssignment_studentId_idx";

-- DropIndex
DROP INDEX "TestAssignment_testId_idx";

-- DropIndex
DROP INDEX "User_classId_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_schoolId_idx";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "teacherReviewed",
ALTER COLUMN "aiScore" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "teacherScore" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ScannedTest" DROP COLUMN "fileUrl",
DROP COLUMN "ocrResults",
DROP COLUMN "ocrStatus",
ADD COLUMN     "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "answers" JSONB,
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "School" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "suspiciousActivity",
DROP COLUMN "teacherReviewed",
ALTER COLUMN "totalScore" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "maxScore" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "dueDate",
DROP COLUMN "schoolId",
DROP COLUMN "teacherId",
DROP COLUMN "timeLimit",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordHash",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'STUDENT';

-- DropEnum
DROP TYPE "OcrStatus";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "SuspiciousActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuspiciousActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_name_key" ON "Class"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "School_slug_key" ON "School"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_studentId_testId_key" ON "Submission"("studentId", "testId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousActivity" ADD CONSTRAINT "SuspiciousActivity_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedTest" ADD CONSTRAINT "ScannedTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScannedTest" ADD CONSTRAINT "ScannedTest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
