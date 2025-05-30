import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "GET endpoint working" });
}

export async function POST(req: NextRequest) {
  console.log('POST /api/appointment: Request received - v2');

  try {
    const body = await req.json();
    console.log('POST /api/appointment: Request body:', body);

    const { userId } = await auth();
    if (!userId) {
      console.log('POST /api/appointment: No user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('POST /api/appointment: User ID:', userId);

    const { id_medecin, date, heure_debut, heure_fin } = body;

    if (!id_medecin || !date || !heure_debut || !heure_fin) {
      console.log('POST /api/appointment: Missing required fields', { id_medecin, date, heure_debut, heure_fin });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user profile
    console.log('POST /api/appointment: Fetching user profile');
    let userProfile = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { Profil: true },
    });
    console.log('POST /api/appointment: User profile:', userProfile);

    if (!userProfile) {
      console.log('POST /api/appointment: User not found, creating new user');
      // Create a new user if they don't exist
      userProfile = await prisma.user.create({
        data: {
          clerkId: userId,
        },
        include: { Profil: true },
      });
      console.log('POST /api/appointment: Created new user:', userProfile);
    }

    if (!userProfile.Profil) {
      console.log('POST /api/appointment: User profile not found, creating one');
      // Create a profile if it doesn't exist
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
          cin: `default-${userId}-${Date.now()}`,
          profession: '',
          adresse: '',
          codePostal: '',
          lieuNaissance: '',
        },
      });
      console.log('POST /api/appointment: Created new profile:', newProfile);
      userProfile.Profil = newProfile;
    }

    // Verify doctor exists
    console.log('POST /api/appointment: Checking if doctor exists');
    const doctor = await prisma.listeMedecins.findUnique({
      where: { id: id_medecin },
    });

    if (!doctor) {
      console.log('POST /api/appointment: Doctor not found');
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }
    console.log('POST /api/appointment: Doctor found:', doctor);

    // Create appointment
    console.log('POST /api/appointment: Creating appointment');
    const appointmentData = {
      db_url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
      db_name: 'postgres',
      id_profil: userProfile.Profil.id,
      id_medecin,
      date: new Date(date),
      heure_debut,
      heure_fin,
      statut: 'En attente',
    };
    console.log('POST /api/appointment: Appointment data:', appointmentData);

    const newAppointment = await prisma.rendezVousCommun.create({
      data: appointmentData,
    });

    console.log('POST /api/appointment: Created appointment:', newAppointment);

    return NextResponse.json({
      message: "Appointment created successfully",
      data: newAppointment
    });
  } catch (error) {
    console.error('POST /api/appointment: Error creating appointment:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the appointment' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
