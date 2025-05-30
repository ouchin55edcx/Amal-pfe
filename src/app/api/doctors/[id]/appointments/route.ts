import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Retrieve all appointments for a specific doctor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const doctorId = id;

    if (!doctorId) {
      return NextResponse.json(
        { error: 'ID du médecin manquant' },
        { status: 400 }
      );
    }

    // Check if the doctor exists
    const doctor = await prisma.listeMedecins.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Médecin non trouvé' }, { status: 404 });
    }



    // Get all appointments for this doctor (including pending ones)
    const appointments = await prisma.rendezVousCommun.findMany({
      where: { id_medecin: doctorId },
      include: {
        profil: true,
        medecin: {
          include: {
            specialite: true,
            ville: true
          }
        }
      },
      orderBy: { date: 'asc' }
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des rendez-vous' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
