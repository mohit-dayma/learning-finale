-- CreateEnum
CREATE TYPE "ReviewGrade" AS ENUM ('HARD', 'NEEDS_WORK', 'GOOD', 'STRONG', 'MASTERED');

-- CreateEnum
CREATE TYPE "AiAssistLevel" AS ENUM ('INDEPENDENT', 'HINT', 'ATTEMPTED_THEN_AI', 'AI_MOST', 'CANNOT_EXPLAIN');

-- CreateEnum
CREATE TYPE "MistakeSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "aiAssistLevel" "AiAssistLevel" NOT NULL DEFAULT 'INDEPENDENT',
ADD COLUMN     "canExplain" BOOLEAN;

-- AlterTable
ALTER TABLE "Mistake" ADD COLUMN     "correctAnswer" TEXT,
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "mentalModel" TEXT,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "questionText" TEXT,
ADD COLUMN     "repeatCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "severity" "MistakeSeverity" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "userAnswer" TEXT,
ADD COLUMN     "whyWrong" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "grade" "ReviewGrade" NOT NULL DEFAULT 'GOOD';
