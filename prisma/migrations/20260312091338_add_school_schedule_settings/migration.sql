/*
  Warnings:

  - You are about to drop the column `address` on the `School` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "School" DROP COLUMN "address",
ADD COLUMN     "breakDuration" INTEGER DEFAULT 10,
ADD COLUMN     "lessonDuration" INTEGER DEFAULT 45,
ADD COLUMN     "lunchBreakEnd" TEXT DEFAULT '13:00',
ADD COLUMN     "lunchBreakStart" TEXT DEFAULT '12:00',
ADD COLUMN     "schoolEndTime" TEXT DEFAULT '16:00',
ADD COLUMN     "schoolStartTime" TEXT DEFAULT '08:00';
