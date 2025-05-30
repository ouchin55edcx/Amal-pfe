import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from '@prisma/client';
import { sendAppointmentConfirmationEmail } from '@/lib/email';

const prisma = new PrismaClient();

// PUT - Update appointment status (for doctors)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const appointmentId = id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['Confirmé', 'Annulé', 'En attente'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide. Les valeurs acceptées sont: Confirmé, Annulé, En attente' },
        { status: 400 }
      );
    }

    // Get the appointment
    const appointment = await prisma.rendezVousCommun.findUnique({
      where: { id: appointmentId },
      include: {
        medecin: true,
        profil: true
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Rendez-vous non trouvé' }, { status: 404 });
    }

    // TODO: Add doctor authentication check here
    // For now, we'll assume any authenticated user can update the status
    // In a real application, you would check if the authenticated user is the doctor

    // Update the appointment status
    const updatedAppointment = await prisma.rendezVousCommun.update({
      where: { id: appointmentId },
      data: { statut: status },
      include: {
        medecin: {
          include: {
            specialite: true,
            ville: true
          }
        },
        profil: true
      }
    });

    // If the status was changed to "Confirmé", send a confirmation email to the patient
    if (status === 'Confirmé' && appointment.profil?.email) {
      try {
        await sendAppointmentConfirmationEmail({
          to: appointment.profil.email,
          patientName: `${appointment.profil.prenom} ${appointment.profil.nom}`,
          doctorName: appointment.medecin.nom,
          date: appointment.date,
          startTime: appointment.heure_debut,
          endTime: appointment.heure_fin
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue with the response even if email fails
      }
    }

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du statut du rendez-vous' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
