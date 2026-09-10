-- DropForeignKey
ALTER TABLE "PlayerStreakState" DROP CONSTRAINT "PlayerStreakState_leagueId_fkey";

-- AlterTable
ALTER TABLE "PlayerStreakState" DROP CONSTRAINT "PlayerStreakState_pkey",
ALTER COLUMN "leagueId" SET NOT NULL,
ADD CONSTRAINT "PlayerStreakState_pkey" PRIMARY KEY ("userId", "seasonId", "leagueId");

-- AddForeignKey
ALTER TABLE "PlayerStreakState" ADD CONSTRAINT "PlayerStreakState_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

