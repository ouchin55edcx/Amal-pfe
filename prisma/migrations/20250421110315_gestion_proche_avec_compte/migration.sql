/*
  Warnings:

  - You are about to drop the column `adresse` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `codePostal` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `dateNaissance` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `lieuNaissance` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `nom` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `photoProfil` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `prenom` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `sexe` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `telephone` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `userAccountId` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `ville` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Profil` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Profil` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Profil` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profilId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profilId` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profilId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Proche" DROP CONSTRAINT "Proche_userAccountId_fkey";

-- DropForeignKey
ALTER TABLE "Profil" DROP CONSTRAINT "Profil_userId_fkey";

-- DropIndex
DROP INDEX "Proche_userAccountId_key";

-- DropIndex
DROP INDEX "Profil_userId_key";

-- AlterTable
ALTER TABLE "Proche" DROP COLUMN "adresse",
DROP COLUMN "codePostal",
DROP COLUMN "dateNaissance",
DROP COLUMN "lieuNaissance",
DROP COLUMN "nom",
DROP COLUMN "photoProfil",
DROP COLUMN "prenom",
DROP COLUMN "sexe",
DROP COLUMN "telephone",
DROP COLUMN "userAccountId",
DROP COLUMN "ville",
ADD COLUMN     "compteExiste" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "profilId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProcheGere" ADD COLUMN     "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "peutGererDocuments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "peutGererRendezVous" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "peutModifierProfil" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Profil" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ALTER COLUMN "dateNaissance" DROP NOT NULL,
ALTER COLUMN "assuranceMaladie" DROP NOT NULL,
ALTER COLUMN "cin" DROP NOT NULL,
ALTER COLUMN "profession" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "profilId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "dateExpiration" TIMESTAMP(3) NOT NULL,
    "accepte" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invitantId" TEXT NOT NULL,
    "profilInviteId" TEXT NOT NULL,
    "procheCibleId" INTEGER NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_profilId_key" ON "User"("profilId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proche" ADD CONSTRAINT "Proche_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitantId_fkey" FOREIGN KEY ("invitantId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_profilInviteId_fkey" FOREIGN KEY ("profilInviteId") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_procheCibleId_fkey" FOREIGN KEY ("procheCibleId") REFERENCES "Proche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
