-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "confidence" INTEGER,
ADD COLUMN     "perceivedDifficulty" "Difficulty",
ADD COLUMN     "usedAi" BOOLEAN NOT NULL DEFAULT false;
