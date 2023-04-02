/*
  Warnings:

  - You are about to drop the column `hash` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token_42]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hashed_passwd` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_42` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_hash_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "hash",
ADD COLUMN     "hashed_passwd" TEXT NOT NULL,
ADD COLUMN     "token_42" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_token_42_key" ON "users"("token_42");
