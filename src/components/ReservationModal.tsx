'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/Calendar';
import {
  FaTimes,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// Define interfaces
interface Doctor {
  id: string;
  nom: string;
  specialite: {
    id: string;
    nom: string;
  };
  ville: {
    id: string;
    nom: string;
  };
  date_debut?: string;
  date_fin?: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DoctorAvailability {
  id_medecin: string;
  heure_debut: string;
  heure_fin: string;
  duree_par_defaut: number;
  indisponibilites: {
    heure_debut: string;
    heure_fin: string;
  }[];
}

interface ExistingAppointment {
  date: string;
  heure_debut: string;
  heure_fin: string;
}

interface ReservationModalProps {
  readonly doctor: Doctor;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly initialDate?: Date;
}

// Utility functions to convert time
const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const convertMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper function to check if two time ranges overlap
const hasOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean => start1 < end2 && end1 > start2;

export default function ReservationModal({
  doctor,
  isOpen,
  onClose,
  initialDate,
}: ReservationModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [doctorAvailability, setDoctorAvailability] =
    useState<DoctorAvailability | null>(null);
  const [existingAppointments, setExistingAppointments] = useState<
    ExistingAppointment[]
  >([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const { isSignedIn } = useUser();
  const router = useRouter();

  // Function to generate all possible time slots
  const generateTimeSlots = (
    startMinutes: number,
    endMinutes: number,
    duration: number
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let time = startMinutes; time < endMinutes; time += duration) {
      const slotEnd = Math.min(time + duration, endMinutes);
      slots.push({
        start: convertMinutesToTime(time),
        end: convertMinutesToTime(slotEnd),
      });
    }
    return slots;
  };

  // Function to check if a slot is unavailable
  const isSlotUnavailable = (
    slot: TimeSlot,
    unavailablePeriods: { heure_debut: string; heure_fin: string }[]
  ): boolean => {
    const slotStart = convertTimeToMinutes(slot.start);
    const slotEnd = convertTimeToMinutes(slot.end);
    return unavailablePeriods.some((period) =>
      hasOverlap(
        slotStart,
        slotEnd,
        convertTimeToMinutes(period.heure_debut),
        convertTimeToMinutes(period.heure_fin)
      )
    );
  };

  // Function to check if a slot is booked
  const isSlotBooked = (
    slot: TimeSlot,
    appointments: ExistingAppointment[]
  ): boolean => {
    const slotStart = convertTimeToMinutes(slot.start);
    const slotEnd = convertTimeToMinutes(slot.end);
    return appointments.some((appointment) =>
      hasOverlap(
        slotStart,
        slotEnd,
        convertTimeToMinutes(appointment.heure_debut),
        convertTimeToMinutes(appointment.heure_fin)
      )
    );
  };

  // Function to calculate available time slots
  const calculateAvailableTimeSlots = useMemo(
    () =>
      (
        startTime: string,
        endTime: string,
        duration: number,
        unavailablePeriods: { heure_debut: string; heure_fin: string }[],
        date: Date,
        appointments: ExistingAppointment[]
      ): TimeSlot[] => {
        const startMinutes = convertTimeToMinutes(startTime);
        const endMinutes = convertTimeToMinutes(endTime);
        const formattedDate = date.toISOString().split('T')[0];
        const appointmentsForDate = appointments.filter((appointment) =>
          appointment.date.startsWith(formattedDate)
        );

        const allSlots = generateTimeSlots(startMinutes, endMinutes, duration);
        return allSlots.filter(
          (slot) =>
            !isSlotUnavailable(slot, unavailablePeriods) &&
            !isSlotBooked(slot, appointmentsForDate)
        );
      },
    []
  );

  // Fetch doctor availability and existing appointments
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !doctor.id) return;

      setLoadingAvailability(true);
      try {
        // Fetch doctor's date range if not provided
        if (!doctor.date_debut || !doctor.date_fin) {
          const doctorsResponse = await fetch('/api/doctors');
          if (doctorsResponse.ok) {
            const doctorsData = await doctorsResponse.json();
            const doctorData = doctorsData.find((d: any) => d.id === doctor.id);
            if (doctorData?.date_debut && doctorData?.date_fin) {
              doctor.date_debut = doctorData.date_debut;
              doctor.date_fin = doctorData.date_fin;
            }
          } else {
            console.error('Error fetching doctor date range');
          }
        }

        // Fetch doctor availability
        const availabilityResponse = await fetch('/indisponibilites.json');
        if (!availabilityResponse.ok) {
          console.error('Error fetching doctor availabilities');
          setError('Erreur lors du chargement des disponibilitÃ©s');
          return;
        }

        const availabilityData: DoctorAvailability[] =
          await availabilityResponse.json();
        const doctorAvail =
          availabilityData.find((a) => a.id_medecin === doctor.id) ||
          availabilityData[0];
        setDoctorAvailability(doctorAvail);

        // Fetch existing appointments
        const appointmentsResponse = await fetch(
          `/api/doctors/${doctor.id}/appointments`
        );
        if (!appointmentsResponse.ok) {
          console.error('Error fetching doctor appointments');
          setError('Erreur lors du chargement des rendez-vous existants');
          return;
        }

        const appointmentsData: ExistingAppointment[] =
          await appointmentsResponse.json();
        setExistingAppointments(appointmentsData);

        if (selectedDate && doctorAvail) {
          const slots = calculateAvailableTimeSlots(
            doctorAvail.heure_debut,
            doctorAvail.heure_fin,
            doctorAvail.duree_par_defaut,
            doctorAvail.indisponibilites,
            selectedDate,
            appointmentsData
          );
          setAvailableTimeSlots(slots);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Une erreur est survenue lors du chargement des donnÃ©es');
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchData();
  }, [isOpen, doctor.id, selectedDate, calculateAvailableTimeSlots]);

  // Recalculate time slots when selected date or availability changes
  useEffect(() => {
    if (selectedDate && doctorAvailability) {
      const slots = calculateAvailableTimeSlots(
        doctorAvailability.heure_debut,
        doctorAvailability.heure_fin,
        doctorAvailability.duree_par_defaut,
        doctorAvailability.indisponibilites,
        selectedDate,
        existingAppointments
      );
      setAvailableTimeSlots(slots);
    }
  }, [
    selectedDate,
    doctorAvailability,
    existingAppointments,
    calculateAvailableTimeSlots,
  ]);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
      setSelectedTimeSlot(null);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, initialDate]);

  // Function to determine disabled days for the calendar
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return true;
    }

    if (doctor.date_debut && doctor.date_fin) {
      const dateDebut = new Date(doctor.date_debut);
      const dateFin = new Date(doctor.date_fin);
      dateDebut.setHours(0, 0, 0, 0);
      dateFin.setHours(0, 0, 0, 0);
      return date < dateDebut || date > dateFin;
    }

    return false;
  };

  const handleSubmit = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      setError('Veuillez sÃ©lectionner une date et un crÃ©neau horaire');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_medecin: doctor.id,
          date: selectedDate.toISOString(),
          heure_debut: selectedTimeSlot.start,
          heure_fin: selectedTimeSlot.end,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/compte/rendez-vous'), 2000);
      } else {
        const data = await response.json();
        setError(
          data.error ??
            'Une erreur est survenue lors de la prise de rendez-vous'
        );
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('Une erreur est survenue lors de la prise de rendez-vous');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = () =>
    !selectedDate || !selectedTimeSlot || isSubmitting;

  const getButtonClassName = () => {
    return isButtonDisabled()
      ? 'rounded-lg px-5 py-2.5 text-lg font-semibold text-white bg-grey-400 cursor-not-allowed'
      : 'rounded-lg px-5 py-2.5 text-lg font-semibold text-white bg-gold-500 hover:bg-gold-600 transition-colors';
  };

  const getButtonContent = () => {
    return isSubmitting ? (
      <span className='flex items-center justify-center'>
        <FaSpinner className='mr-2 animate-spin text-white' />
        Traitement...
      </span>
    ) : (
      'Confirmer le rendez-vous'
    );
  };

  const renderTimeSlotSection = () => {
    if (loadingAvailability) {
      return (
        <div className='flex h-24 items-center justify-center'>
          <p className='text-grey-600'>Chargement des disponibilitÃ©s...</p>
        </div>
      );
    }

    if (availableTimeSlots.length > 0) {
      return (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {availableTimeSlots.map((slot) => (
            <button
              key={`${slot.start}-${slot.end}`}
              className={`rounded-md border p-3 text-center text-sm font-medium transition-colors ${
                selectedTimeSlot?.start === slot.start
                  ? 'border-aqua-500 bg-aqua-500 text-white'
                  : 'border-grey-300 text-grey-800 hover:border-aqua-400 hover:bg-aqua-50'
              }`}
              onClick={() => setSelectedTimeSlot(slot)}
            >
              {slot.start} - {slot.end}
            </button>
          ))}
        </div>
      );
    }

    return (
      <div className='bg-gold-100 text-gold-800 rounded-md p-4 text-center text-sm'>
        <p className='font-medium'>
          Aucun crÃ©neau disponible pour cette date.
        </p>
        <p className='mt-1'>Veuillez sÃ©lectionner une autre date.</p>
      </div>
    );
  };

  const renderContent = () => {
    if (success) {
      return (
        <div className='flex flex-col items-center justify-center py-8'>
          <div className='bg-aqua-100 mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
            <FaCheck className='text-aqua-600 h-8 w-8' />
          </div>
          <h3 className='text-grey-900 mb-2 text-xl font-semibold'>
            Rendez-vous confirmÃ©
          </h3>
          <p className='text-grey-700 text-center'>
            Votre rendez-vous a Ã©tÃ© enregistrÃ© avec succÃ¨s. Vous allez
            Ãªtre redirigÃ© vers la page de vos rendez-vous.
          </p>
        </div>
      );
    }

    return (
      <>
        <div className='mb-6'>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center'>
              <FaCalendarAlt className='text-aqua-600 mr-2' />
              <h3 className='text-grey-900 text-lg font-semibold'>
                SÃ©lectionnez une date
              </h3>
            </div>
            {doctor.date_debut && doctor.date_fin && (
              <span className='text-grey-600 text-sm'>
                Disponible du {new Date(doctor.date_debut).toLocaleDateString()}{' '}
                au {new Date(doctor.date_fin).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className='flex justify-center'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className='border-grey-300 text-grey-900 rounded-md border'
              modifiersClassNames={{
                selected: '!bg-aqua-600 !text-white',
                disabled: 'text-grey-400',
              }}
            />
          </div>
        </div>

        {selectedDate && (
          <div className='mb-6'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center'>
                <FaClock className='text-aqua-600 mr-2' />
                <h3 className='text-grey-900 text-lg font-semibold'>
                  SÃ©lectionnez un crÃ©neau horaire
                </h3>
              </div>
              {loadingAvailability && (
                <FaSpinner className='text-aqua-600 h-5 w-5 animate-spin' />
              )}
            </div>
            {renderTimeSlotSection()}
          </div>
        )}

        {error && (
          <div className='mb-4 rounded-md bg-red-100 p-3 text-sm font-medium text-red-700'>
            {error}
          </div>
        )}

        <div className='flex justify-end'>
          <button
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            className={getButtonClassName()}
          >
            {getButtonContent()}
          </button>
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black'>
      <div className='relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
        <button
          onClick={onClose}
          className='text-grey-700 hover:text-grey-900 absolute top-4 right-4'
          aria-label='Fermer'
        >
          <FaTimes className='h-6 w-6' />
        </button>

        <div className='mb-6 text-center'>
          <h2 className='text-grey-900 text-2xl font-bold'>
            Prendre rendez-vous
          </h2>
          <p className='text-grey-700 mt-2 text-lg'>
            avec Dr. {doctor.nom} - {doctor.specialite.nom}
          </p>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
