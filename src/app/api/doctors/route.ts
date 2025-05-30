
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const doctors = await prisma.listeMedecins.findMany({
      include: {
        specialite: true,
        ville: true,
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération des médecins' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

