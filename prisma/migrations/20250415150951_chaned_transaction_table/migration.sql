/*
  Warnings:

  - You are about to drop the column `category` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `vpa` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `account` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `counterparty` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "Transaction_reference_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
DROP COLUMN "name",
DROP COLUMN "vpa",
ADD COLUMN     "account" TEXT NOT NULL,
ADD COLUMN     "counterparty" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
