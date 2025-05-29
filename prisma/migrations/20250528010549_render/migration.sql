/*
  Warnings:

  - You are about to drop the column `compteExiste` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `profilId` on the `Proche` table. All the data in the column will be lost.
  - You are about to drop the column `dateCreation` on the `ProcheGere` table. All the data in the column will be lost.
  - You are about to drop the column `peutGererDocuments` on the `ProcheGere` table. All the data in the column will be lost.
  - You are about to drop the column `peutGererRendezVous` on the `ProcheGere` table. All the data in the column will be lost.
  - You are about to drop the column `peutModifierProfil` on the `ProcheGere` table. All the data in the column will be lost.
  - You are about to drop the column `profilId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Invitation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userAccountId]` on the table `Proche` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Profil` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Profil` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lieuNaissance` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prenom` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sexe` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telephone` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ville` to the `Proche` table without a default value. This is not possible if the table is not empty.
  - Made the column `role` on table `ProcheGere` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `userId` to the `Profil` table without a default value. This is not possible if the table is not empty.
  - Made the column `assuranceMaladie` on table `Profil` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cin` on table `Profil` required. This step will fail if there are existing NULL values in that column.
  - Made the column `profession` on table `Profil` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_invitantId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_procheCibleId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_profilInviteId_fkey";

-- DropForeignKey
ALTER TABLE "Proche" DROP CONSTRAINT "Proche_profilId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_profilId_fkey";

-- DropIndex
DROP INDEX "User_profilId_key";

-- AlterTable
ALTER TABLE "Proche" DROP COLUMN "compteExiste",
DROP COLUMN "profilId",
ADD COLUMN     "adresse" TEXT,
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "dateNaissance" TIMESTAMP(3),
ADD COLUMN     "lieuNaissance" TEXT NOT NULL,
ADD COLUMN     "nom" TEXT NOT NULL,
ADD COLUMN     "photoProfil" TEXT,
ADD COLUMN     "prenom" TEXT NOT NULL,
ADD COLUMN     "sexe" TEXT NOT NULL,
ADD COLUMN     "telephone" TEXT NOT NULL,
ADD COLUMN     "userAccountId" TEXT,
ADD COLUMN     "ville" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProcheGere" DROP COLUMN "dateCreation",
DROP COLUMN "peutGererDocuments",
DROP COLUMN "peutGererRendezVous",
DROP COLUMN "peutModifierProfil",
ALTER COLUMN "role" SET NOT NULL;

-- AlterTable
ALTER TABLE "Profil" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "assuranceMaladie" SET NOT NULL,
ALTER COLUMN "cin" SET NOT NULL,
ALTER COLUMN "profession" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profilId";

-- DropTable
DROP TABLE "Invitation";

-- CreateTable
CREATE TABLE "Specialite" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Specialite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ville" (
    "id" TEXT NOT NULL,
    "region" TEXT,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Ville_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeMedecins" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "specialiteId" TEXT NOT NULL,
    "villeId" TEXT NOT NULL,

    CONSTRAINT "ListeMedecins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVousCommun" (
    "id" TEXT NOT NULL,
    "db_url" TEXT NOT NULL,
    "db_name" TEXT NOT NULL,
    "id_profil" TEXT NOT NULL,
    "id_medecin" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "heure_debut" TEXT NOT NULL,
    "heure_fin" TEXT NOT NULL,
    "statut" TEXT NOT NULL,

    CONSTRAINT "RendezVousCommun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Specialite_nom_key" ON "Specialite"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Ville_nom_key" ON "Ville"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Proche_userAccountId_key" ON "Proche"("userAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Profil_email_key" ON "Profil"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profil_userId_key" ON "Profil"("userId");

-- AddForeignKey
ALTER TABLE "Profil" ADD CONSTRAINT "Profil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("clerkId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proche" ADD CONSTRAINT "Proche_userAccountId_fkey" FOREIGN KEY ("userAccountId") REFERENCES "User"("clerkId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeMedecins" ADD CONSTRAINT "ListeMedecins_specialiteId_fkey" FOREIGN KEY ("specialiteId") REFERENCES "Specialite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListeMedecins" ADD CONSTRAINT "ListeMedecins_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "Ville"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousCommun" ADD CONSTRAINT "RendezVousCommun_id_medecin_fkey" FOREIGN KEY ("id_medecin") REFERENCES "ListeMedecins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVousCommun" ADD CONSTRAINT "RendezVousCommun_id_profil_fkey" FOREIGN KEY ("id_profil") REFERENCES "Profil"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
