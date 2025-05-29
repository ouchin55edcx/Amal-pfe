import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest) {
  // 1) Auth
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2) Récupère l’ID du proche
  const procheId = Number(req.nextUrl.pathname.split('/').pop());
  if (!procheId)
    return NextResponse.json(
      { error: 'ID du proche manquant' },
      { status: 400 }
    );

  // 3) Vérifie les droits via ProcheGere
  const droit = await prisma.procheGere.findUnique({
    where: { userId_procheId: { userId, procheId } },
  });
  if (!droit?.peutModifierProfil) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // 4) Lit les données du body
  const {
    prenom,
    nom,
    dateNaissance,
    sexe,
    telephone,
    lieuNaissance,
    photoProfil,
    adresse,
    codePostal,
    ville,
  } = await req.json();

  // 5) Met à jour **uniquement** le Profil associé au Proche
  const updated = await prisma.profil.update({
    where: {
      id: (await prisma.proche.findUnique({
        where: { id: procheId },
        select: { profilId: true },
      }))!.profilId,
    },
    data: {
      prenom,
      nom,
      dateNaissance: dateNaissance ? new Date(dateNaissance) : undefined,
      sexe,
      telephone,
      lieuNaissance,
      photoProfil: photoProfil ?? null,
      adresse: adresse ?? null,
      codePostal: codePostal ?? null,
      ville: ville ?? null,
    },
  });

  return NextResponse.json({
    success: true,
    profil: updated,
    droits: {
      peutModifierProfil: droit.peutModifierProfil,
      peutGererRendezVous: droit.peutGererRendezVous,
      peutGererDocuments: droit.peutGererDocuments,
    },
  });
}

export async function DELETE(req: NextRequest) {
  // 1) Auth
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2) ID du proche
  const procheId = Number(req.nextUrl.pathname.split('/').pop());
  if (!procheId)
    return NextResponse.json(
      { error: 'ID du proche manquant' },
      { status: 400 }
    );

  // 3) Vérifie que l’utilisateur gére bien ce proche
  const droit = await prisma.procheGere.findUnique({
    where: { userId_procheId: { userId, procheId } },
  });
  if (!droit) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // 4) Supprime seulement **la relation** dans ProcheGere
  await prisma.procheGere.delete({
    where: { userId_procheId: { userId, procheId } },
  });

  return NextResponse.json({
    success: true,
    message: 'Le proche a été retiré de votre liste.',
  });
}
