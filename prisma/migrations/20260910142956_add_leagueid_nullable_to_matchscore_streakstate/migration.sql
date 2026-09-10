-- AlterTable
ALTER TABLE "MatchScore" ADD COLUMN     "leagueId" TEXT;

-- AlterTable
ALTER TABLE "PlayerStreakState" ADD COLUMN     "leagueId" TEXT;

-- CreateIndex
CREATE INDEX "MatchScore_leagueId_idx" ON "MatchScore"("leagueId");

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStreakState" ADD CONSTRAINT "PlayerStreakState_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;
