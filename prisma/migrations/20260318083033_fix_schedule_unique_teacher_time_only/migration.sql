/*
  Warnings:

  - A unique constraint covering the columns `[teacherId,dayOfWeek,startTime]` on the table `Schedule` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Schedule_courseId_dayOfWeek_startTime_key";

-- CreateIndex
CREATE UNIQUE INDEX "Schedule_teacherId_dayOfWeek_startTime_key" ON "Schedule"("teacherId", "dayOfWeek", "startTime");
