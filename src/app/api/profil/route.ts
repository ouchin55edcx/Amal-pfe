import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET — Récupérer le profil de l’utilisateur
export async function GET(request: NextRequest) {
  const { userId: clerkId } = getAuth(request);
  if (!clerkId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    const userWithProfil = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        profil: {
          select: {
            sexe: true,
            prenom: true,
            nom: true,
            dateNaissance: true,
            lieuNaissance: true,
            ville: true,
            adresse: true,
            codePostal: true,
            telephone: true,
            email: true,
            assuranceMaladie: true,
            cin: true,
            profession: true,
            photoProfil: true,
          },
        },
      },
    });

    const p = userWithProfil?.profil;
    if (!p) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    // formater la date pour le front
    const formatted = {
      ...p,
      dateNaissance: p.dateNaissance?.toISOString().split('T')[0] ?? null,
    };

    return NextResponse.json(formatted);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST — Créer ou mettre à jour le profil
export async function POST(request: NextRequest) {
  const { userId: clerkId } = getAuth(request);
  if (!clerkId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  // validation...
  const required = {
    prenom: 'Prénom',
    nom: 'Nom',
    email: 'Email',
    sexe: 'Sexe',
    dateNaissance: 'Date de naissance',
    telephone: 'Téléphone',
    ville: 'Ville',
    lieuNaissance: 'Lieu de naissance',
  };
  const missing = Object.entries(required)
    .filter(([k]) => !body[k])
    .map(([, v]) => v);
  if (missing.length) {
    return NextResponse.json(
      { error: `Champs manquants : ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    // retrouver l'user + son profil
    const existing = await prisma.user.findUnique({
      where: { clerkId },
      include: { profil: true },
    });

    // vérifier unicité du CIN
    if (body.cin && existing?.profil?.cin !== body.cin) {
      const cinTaken = await prisma.profil.findUnique({
        where: { cin: body.cin },
      });
      if (cinTaken) {
        return NextResponse.json(
          { error: 'Ce CIN est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    const payload = {
      prenom: body.prenom,
      nom: body.nom,
      email: body.email,
      sexe: body.sexe,
      dateNaissance: new Date(body.dateNaissance),
      telephone: body.telephone,
      ville: body.ville,
      lieuNaissance: body.lieuNaissance,
      adresse: body.adresse,
      codePostal: body.codePostal,
      assuranceMaladie: body.assuranceMaladie,
      cin: body.cin,
      profession: body.profession,
      photoProfil: body.photoProfil,
    };

    if (!existing) {
      // ni user ni profil
      await prisma.user.create({
        data: {
          clerkId,
          profil: { create: payload },
        },
      });
    } else if (!existing.profil) {
      // user mais pas de profil
      await prisma.profil.create({
        data: {
          ...payload,
          user: { connect: { clerkId } },
        },
      });
    } else {
      // update du profil existant
      await prisma.profil.update({
        where: { id: existing.profil.id },
        data: payload,
      });
    }

    return NextResponse.json({ success: true, message: 'Profil mis à jour' });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
