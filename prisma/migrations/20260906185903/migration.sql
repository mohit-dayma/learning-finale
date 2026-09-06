-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('TECHNICAL_EXPLANATION', 'CODING', 'DEBUGGING', 'DESIGN', 'SCENARIO');

-- AlterTable
ALTER TABLE "CareerApplication" ADD COLUMN     "interviewNotes" TEXT,
ADD COLUMN     "skillsRequired" TEXT;

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "commonMisconceptions" TEXT,
ADD COLUMN     "followUpExpected" TEXT,
ADD COLUMN     "followUpPrompt" TEXT,
ADD COLUMN     "format" "InterviewFormat" NOT NULL DEFAULT 'TECHNICAL_EXPLANATION',
ADD COLUMN     "interviewWeight" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "keyPoints" TEXT;

-- CreateTable
CREATE TABLE "InterviewAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "whatCorrect" TEXT,
    "whatMissed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewAttempt_userId_createdAt_idx" ON "InterviewAttempt"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InterviewAttempt_questionId_idx" ON "InterviewAttempt"("questionId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_format_idx" ON "InterviewQuestion"("format");

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAttempt" ADD CONSTRAINT "InterviewAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
