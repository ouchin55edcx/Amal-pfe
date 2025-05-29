// src/app/api/appointment/confirmed/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const appointments = await prisma.rendezVousCommun.findMany({
      where: { statut: 'Confirmé' },
      select: {
        id_medecin: true,
        date: true,
        heure_debut: true,
        heure_fin: true,
      },
    });

    const appointmentsByDoctor = appointments.reduce(
      (
        acc: Record<
          string,
          { date: Date; heure_debut: string; heure_fin: string }[]
        >,
        appointment: {
          id_medecin: string; // Corrected to string (UUID)
          date: Date;
          heure_debut: string;
          heure_fin: string;
        }
      ) => {
        const key = appointment.id_medecin; // No toString() needed
        acc[key] ??= [];
        acc[key].push({
          date: appointment.date,
          heure_debut: appointment.heure_debut,
          heure_fin: appointment.heure_fin,
        });
        return acc;
      },
      {}
    );

    return NextResponse.json(appointmentsByDoctor);
  } catch (error) {
    console.error('Error fetching confirmed appointments:', error);
    return NextResponse.json(
      {
        error:
          'Une erreur est survenue lors de la récupération des rendez-vous confirmés',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
