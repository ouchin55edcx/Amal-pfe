import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await prisma.proche.findMany({
    where: { gerants: { some: { userId } } },
    include: {
      profil: { include: { user: true } },
      gerants: {
        where: { userId },
        select: {
          role: true,
          peutGererRendezVous: true,
          peutGererDocuments: true,
          peutModifierProfil: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  const result = data.map((p) => {
    const droit = p.gerants[0] || {
      role: null,
      peutGererRendezVous: false,
      peutGererDocuments: false,
      peutModifierProfil: true,
    };
    const compteExiste = Boolean(p.profil.user);
    return {
      id: p.id,
      profil: {
        prenom: p.profil.prenom,
        nom: p.profil.nom,
        dateNaissance: p.profil.dateNaissance,
        telephone: p.profil.telephone,
        email: p.profil.email,
        sexe: p.profil.sexe,
        lieuNaissance: p.profil.lieuNaissance,
        adresse: p.profil.adresse,
        codePostal: p.profil.codePostal,
        ville: p.profil.ville,
        photoProfil: p.profil.photoProfil,
      },
      compteExiste,
      droits: {
        ...droit,
        // si le proche a un compte on interdit la modif de profil
        peutModifierProfil: compteExiste ? false : droit.peutModifierProfil,
      },
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    prenom,
    nom,
    dateNaissance,
    sexe,
    telephone,
    email,
    lieuNaissance,
    photoProfil,
    adresse,
    codePostal,
    ville,
  } = await req.json();

  const existing = await prisma.profil.findFirst({
    where: { email },
    include: { user: true },
  });
  const compteExiste = Boolean(existing?.user);

  const newProche = await prisma.proche.create({
    data: {
      compteExiste,
      profil: existing
        ? { connect: { id: existing.id } }
        : {
            create: {
              prenom,
              nom,
              dateNaissance: new Date(dateNaissance),
              sexe,
              telephone,
              email,
              lieuNaissance,
              photoProfil,
              adresse,
              codePostal,
              ville,
            },
          },
      gerants: {
        create: {
          userId,
          role: 'Responsable légal',
          peutGererRendezVous: true,
          peutGererDocuments: true,
          peutModifierProfil: !compteExiste,
        },
      },
    },
    include: {
      profil: true,
      gerants: {
        where: { userId },
        select: {
          peutModifierProfil: true,
          peutGererRendezVous: true,
          peutGererDocuments: true,
        },
      },
    },
  });

  return NextResponse.json({
    id: newProche.id,
    profil: {
      prenom: newProche.profil.prenom,
      nom: newProche.profil.nom,
      dateNaissance: newProche.profil.dateNaissance,
      telephone: newProche.profil.telephone,
      email: newProche.profil.email,
      sexe: newProche.profil.sexe,
      lieuNaissance: newProche.profil.lieuNaissance,
      adresse: newProche.profil.adresse,
      codePostal: newProche.profil.codePostal,
      ville: newProche.profil.ville,
      photoProfil: newProche.profil.photoProfil,
    },
    compteExiste,
    droits: {
      peutModifierProfil: newProche.gerants[0].peutModifierProfil,
      peutGererRendezVous: newProche.gerants[0].peutGererRendezVous,
      peutGererDocuments: newProche.gerants[0].peutGererDocuments,
    },
  });
}
