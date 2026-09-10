-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropIndex
DROP INDEX "Player_externalRef_key";

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "teamId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Player" ALTER COLUMN "teamId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Player_teamId_externalRef_key" ON "Player"("teamId", "externalRef");

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
