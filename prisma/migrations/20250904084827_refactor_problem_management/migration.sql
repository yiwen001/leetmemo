/*
  Warnings:

  - You are about to drop the `problems` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `leetcode_problems` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `leetcode_problems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `study_plans` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_leetcode_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_user_id_fkey";

-- DropIndex
DROP INDEX "public"."leetcode_problems_number_key";

-- AlterTable
ALTER TABLE "public"."leetcode_problems" ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."study_plans" ADD COLUMN     "name" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."problems";

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_problems_slug_key" ON "public"."leetcode_problems"("slug");

-- AddForeignKey
ALTER TABLE "public"."leetcode_problems" ADD CONSTRAINT "leetcode_problems_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
