-- DropForeignKey
ALTER TABLE "MatchScore" DROP CONSTRAINT "MatchScore_leagueId_fkey";

-- DropIndex
DROP INDEX "MatchScore_matchId_userId_key";

-- AlterTable
ALTER TABLE "MatchScore" ALTER COLUMN "leagueId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "MatchScore_matchId_userId_leagueId_key" ON "MatchScore"("matchId", "userId", "leagueId");

-- AddForeignKey
ALTER TABLE "MatchScore" ADD CONSTRAINT "MatchScore_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

