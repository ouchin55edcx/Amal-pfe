import { NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { userId: clerkId } = getAuth(request as any);
  if (!clerkId) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  try {
    // On cherche d'abord le user local
    const userWithProfile = await prisma.user.findUnique({
      where: { clerkId },
      include: { profil: true },
    });

    // Si c'est la première connexion (pas de profil local) → on initialise
    if (!userWithProfile?.profil) {
      // Récupère le user existant chez Clerk
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(clerkId);
      const prenom = clerkUser.firstName ?? '';
      const nom = clerkUser.lastName ?? '';
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ?? '';

      // Crée le user + profil en local
      await prisma.user.create({
        data: {
          clerkId,
          profil: {
            create: {
              prenom,
              nom,
              email,
              sexe: 'Non spécifié',
              telephone: '',
              ville: '',
              lieuNaissance: '',
              adresse: '',
              codePostal: '',
              assuranceMaladie: '',
              cin: '',
              profession: '',
            },
          },
        },
      });

      return NextResponse.json({ success: true, firstLogin: true });
    }

    // Sinon, c'est un user existant → on synchronise local → Clerk
    const { prenom, nom, email } = userWithProfile.profil;

    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const { emailAddresses, primaryEmailAddressId } = clerkUser;

    // Prépare l'email cible si besoin
    let targetEmailId = emailAddresses.find(
      (e) => e.emailAddress === email
    )?.id;
    if (primaryEmailAddressId !== targetEmailId) {
      if (!targetEmailId) {
        const created = await clerk.emailAddresses.createEmailAddress({
          userId: clerkId,
          emailAddress: email,
          primary: false,
        });
        targetEmailId = created.id;
      }
    }

    // Un seul appel pour tout mettre à jour
    await clerk.users.updateUser(clerkId, {
      firstName: prenom,
      lastName: nom,
      ...(targetEmailId && { primaryEmailAddressId: targetEmailId }),
    });

    return NextResponse.json({ success: true, firstLogin: false });
  } catch (err: any) {
    console.error('Erreur de synchronisation vers Clerk :', err);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation vers Clerk' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
