import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  console.log('GET /api/appointment received:', req.nextUrl.pathname);
  const { userId } = await auth();
  if (!userId) {
    console.log('GET /api/appointment: Authentication failed, no userId');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { Profil: true },
    });

    if (!userProfile) {
      console.log('GET /api/appointment: User not found for userId:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Crée un profil par défaut si l'utilisateur n'en a pas
    if (!userProfile.Profil) {
      console.log(
        'GET /api/appointment: User profile not found, creating a default profile for userId:',
        userId
      );
      const newProfile = await prisma.profil.create({
        data: {
          userId: userProfile.clerkId,
          prenom: '',
          nom: '',
          sexe: '',
          telephone: '',
          email: '',
          ville: '',
          assuranceMaladie: '',
          cin: `default-${userId}-${Date.now()}`, // Génère un CIN unique
          profession: '',
          adresse: '',
          codePostal: '',
          lieuNaissance: '',
        },
      });
      userProfile.Profil = newProfile; // Associez le nouveau profil à l'utilisateur
    }

    const appointments = await prisma.rendezVousCommun.findMany({
      where: { id_profil: userProfile.Profil.id },
      include: {
        medecin: {
          include: {
            specialite: true,
            ville: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    console.log(
      'GET /api/appointment: Fetched appointments:',
      appointments.length
    );
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('GET /api/appointment: Error fetching appointments:', error);
    return NextResponse.json(
      {
        error:
          'Une erreur est survenue lors de la récupération des rendez-vous',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  console.log('POST /api/appointment received:', req.nextUrl.pathname);
  let body;
  try {
    body = await req.json();
    console.log('POST /api/appointment: Request body:', body);
  } catch (error) {
    console.error('POST /api/appointment: Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    console.log('POST /api/appointment: Authentication failed, no userId');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id_medecin, date, heure_debut, heure_fin } = body;

    if (!id_medecin || !date || !heure_debut || !heure_fin) {
      console.log('POST /api/appointment: Missing required fields:', {
        id_medecin,
        date,
        heure_debut,
        heure_fin,
      });
      return NextResponse.json(
        {
          error:
            'Tous les champs sont requis (id_medecin, date, heure_debut, heure_fin)',
        },
        { status: 400 }
      );
    }

    const formattedDate = new Date(date);
    if (isNaN(formattedDate.getTime())) {
      console.error('POST /api/appointment: Invalid date format');
      return NextResponse.json(
        { error: 'Format de date invalide' },
        { status: 400 }
      );
    }

    // Vérifiez si l'utilisateur existe et récupérez son profil
    const userProfile = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { Profil: true },
    });

    if (!userProfile) {
      console.log('POST /api/appointment: User not found for userId:', userId);
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!userProfile.Profil) {
      console.log(
        'POST /api/appointment: User profile not found for userId:',
        userId
      );
      const newProfile = await prisma.profil.create({
        data: {
          userId: userProfile.clerkId,
          prenom: '',
          nom: '',
          sexe: '',
          telephone: '',
          email: '',
          ville: '',
          assuranceMaladie: '',
          cin: `default-${userId}-${Date.now()}`, // CIN unique
          profession: '',
          adresse: '',
          codePostal: '',
          lieuNaissance: '',
        },
      });
      userProfile.Profil = newProfile;
    }

    const doctor = await prisma.listeMedecins.findUnique({
      where: { id: id_medecin },
    });

    if (!doctor) {
      console.log(
        'POST /api/appointment: Doctor not found for id_medecin:',
        id_medecin
      );
      return NextResponse.json(
        { error: 'Médecin non trouvé' },
        { status: 404 }
      );
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('POST /api/appointment: DATABASE_URL not set');
      return NextResponse.json(
        { error: 'DATABASE_URL environment variable is not set' },
        { status: 500 }
      );
    }

    const newAppointment = await prisma.rendezVousCommun.create({
      data: {
        db_url: dbUrl,
        db_name: 'postgres',
        id_profil: userProfile.Profil.id,
        id_medecin,
        date: formattedDate,
        heure_debut,
        heure_fin,
        statut: 'En attente',
      },
      include: {
        medecin: {
          include: {
            specialite: true,
            ville: true,
          },
        },
      },
    });

    console.log(
      'POST /api/appointment: New appointment created:',
      newAppointment
    );

    // Commenté pour séparation : à réintégrer dans la branche email
    // await sendAppointmentConfirmationEmail({
    //   to: userProfile.Profil.email,
    //   patientName: userProfile.Profil.prenom,
    //   doctorName: doctor.nom,
    //   date: formattedDate,
    //   startTime: heure_debut,
    //   endTime: heure_fin,
    // });

    return NextResponse.json(newAppointment);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(
        'POST /api/appointment: Error creating appointment:',
        error.message
      );
    } else {
      console.error('POST /api/appointment: Unknown error occurred:', error);
    }
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du rendez-vous' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
