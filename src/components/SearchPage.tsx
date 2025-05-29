'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPinIcon } from '@heroicons/react/24/solid';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import ReservationModal from '@/components/ReservationModal';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('query') ?? ''
  );
  const [locationQuery, setLocationQuery] = useState(
    searchParams.get('location') ?? ''
  );

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
    date: Date;
    heure_debut: string;
    heure_fin: string;
  }

  type AppointmentsByDoctor = Record<string, ExistingAppointment[]>;

  interface Doctor {
    id: string;
    nom: string;
    specialite: string;
    location: string;
    image?: string;
    disponibilite?: TimeSlot[][];
    acceptsNewPatients?: boolean;
  }

  interface FormattedDoctor {
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
  }

  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const doctorsPerPage = 5;
  const [doctorAvailabilities, setDoctorAvailabilities] = useState<
    DoctorAvailability[]
  >([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState<
    Record<string, ExistingAppointment[]>
  >({});
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<FormattedDoctor | null>(
    null
  );

  const calculateAvailableTimeSlots = useCallback(
    (
      startTime: string,
      endTime: string,
      duration: number,
      unavailablePeriods: { heure_debut: string; heure_fin: string }[],
      doctorId: string,
      dayIndex: number,
      doctorAppointments: Record<string, ExistingAppointment[]>
    ): TimeSlot[] => {
      const convertTimeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const convertMinutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      };

      const startMinutes = convertTimeToMinutes(startTime);
      const endMinutes = convertTimeToMinutes(endTime);

      const allSlots: TimeSlot[] = [];
      for (let time = startMinutes; time < endMinutes; time += duration) {
        const slotEnd = Math.min(time + duration, endMinutes);
        allSlots.push({
          start: convertMinutesToTime(time),
          end: convertMinutesToTime(slotEnd),
        });
      }

      const date = new Date();
      date.setDate(date.getDate() + dayIndex);

      const doctorAppointmentsForDay = (
        doctorAppointments[doctorId] ?? []
      ).filter((appointment) => {
        const appointmentDate = new Date(appointment.date);
        return (
          appointmentDate.getFullYear() === date.getFullYear() &&
          appointmentDate.getMonth() === date.getMonth() &&
          appointmentDate.getDate() === date.getDate()
        );
      });

      return allSlots.filter((slot) => {
        const slotStart = convertTimeToMinutes(slot.start);
        const slotEnd = convertTimeToMinutes(slot.end);

        const overlapsWithUnavailablePeriod = unavailablePeriods.some(
          (period) => {
            const unavailableStart = convertTimeToMinutes(period.heure_debut);
            const unavailableEnd = convertTimeToMinutes(period.heure_fin);
            return (
              (slotStart >= unavailableStart && slotStart < unavailableEnd) ||
              (slotEnd > unavailableStart && slotEnd <= unavailableEnd) ||
              (slotStart <= unavailableStart && slotEnd >= unavailableEnd)
            );
          }
        );

        const overlapsWithExistingAppointment = doctorAppointmentsForDay.some(
          (appointment) => {
            const appointmentStart = convertTimeToMinutes(
              appointment.heure_debut
            );
            const appointmentEnd = convertTimeToMinutes(appointment.heure_fin);
            return (
              (slotStart >= appointmentStart && slotStart < appointmentEnd) ||
              (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
              (slotStart <= appointmentStart && slotEnd >= appointmentEnd)
            );
          }
        );

        return (
          !overlapsWithUnavailablePeriod && !overlapsWithExistingAppointment
        );
      });
    },
    []
  );

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`
        );
        if (response.ok) {
          const data = await response.json();
          setFilteredDoctors(data);
        } else {
          console.error('Error fetching doctors');
        }

        const availabilityResponse = await fetch('/indisponibilites.json');
        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();
          setDoctorAvailabilities(availabilityData);
        } else {
          console.error('Error fetching doctor availabilities');
        }

        const appointmentsResponse = await fetch('/api/appointment/confirmed');
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          setConfirmedAppointments(appointmentsData);
        } else {
          console.error('Error fetching confirmed appointments');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [searchQuery, locationQuery]);

  useEffect(() => {
    if (filteredDoctors.length > 0 && doctorAvailabilities.length > 0) {
      const hasAvailability = filteredDoctors.some(
        (doctor) => doctor.disponibilite && doctor.disponibilite.length > 0
      );

      if (!hasAvailability) {
        const updatedDoctors = filteredDoctors.map((doctor, index) => {
          const availability = index < 3 ? doctorAvailabilities[index] : null;

          if (availability) {
            const nextSixDaysSlots: TimeSlot[][] = [];
            for (let i = 0; i < 6; i++) {
              const availableSlots = calculateAvailableTimeSlots(
                availability.heure_debut,
                availability.heure_fin,
                availability.duree_par_defaut,
                availability.indisponibilites,
                doctor.id,
                i,
                confirmedAppointments
              );
              nextSixDaysSlots.push(availableSlots);
            }
            return { ...doctor, disponibilite: nextSixDaysSlots };
          }
          return doctor;
        });
        setFilteredDoctors(updatedDoctors);
      }
    }
  }, [
    doctorAvailabilities,
    filteredDoctors,
    confirmedAppointments,
    calculateAvailableTimeSlots,
  ]);

  const uniqueNames = [...new Set(filteredDoctors.map((doctor) => doctor.nom))];
  const uniqueSpecialties = [
    ...new Set(filteredDoctors.map((doctor) => doctor.specialite)),
  ];
  const uniqueLocations = [
    ...new Set(filteredDoctors.map((doctor) => doctor.location)),
  ];

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setLocationQuery('');
    setCurrentPage(1);
  };

  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(
    indexOfFirstDoctor,
    indexOfLastDoctor
  );
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className='flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white'>
      <Header />
      <div className='container mx-auto flex max-w-6xl flex-grow flex-col p-4'>
        <div className='mt-8 mb-8 flex flex-col gap-4 sm:flex-row'>
          <div className='relative sm:w-64'>
            <input
              type='text'
              placeholder='Nom, spÃ©cialitÃ©...'
              className='w-full rounded-lg border bg-white px-4 py-3 text-black shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              list='name-datalist'
            />
            <datalist id='name-datalist'>
              {uniqueNames
                .filter((name) =>
                  name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((name) => (
                  <option key={name} value={name} />
                ))}
              {uniqueSpecialties
                .filter((specialty) =>
                  specialty.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((specialty) => (
                  <option key={specialty} value={specialty} />
                ))}
            </datalist>
          </div>

          <div className='relative sm:w-64'>
            <input
              type='text'
              placeholder='Lieu...'
              className='w-full rounded-lg border bg-white px-4 py-3 text-black shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none'
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              list='location-datalist'
            />
            <datalist id='location-datalist'>
              {uniqueLocations
                .filter((location) =>
                  location.toLowerCase().includes(locationQuery.toLowerCase())
                )
                .map((location) => (
                  <option key={location} value={location} />
                ))}
            </datalist>
          </div>

          <button
            onClick={handleSearch}
            className='bg-primary hover:bg-primary-700 mt-4 rounded-lg px-4 py-3 text-black transition-colors sm:mt-0'
          >
            Rechercher
          </button>

          <button
            onClick={handleClearSearch}
            className='mt-4 rounded-lg bg-gray-200 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-300 sm:mt-0'
          >
            Effacer
          </button>
        </div>

        {loading ? (
          <div className='my-12 flex justify-center'>
            <div className='border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2'></div>
          </div>
        ) : (
          <div className='flex flex-grow flex-col'>
            <div className='mb-4 text-gray-700'>
              <p className='font-medium'>
                {filteredDoctors.length}{' '}
                {filteredDoctors.length === 1
                  ? 'mÃ©decin trouvÃ©'
                  : 'mÃ©decins trouvÃ©s'}
                {searchQuery && ` pour "${searchQuery}"`}
                {locationQuery && ` Ã  ${locationQuery}`}
              </p>
            </div>

            <div className='mb-8 space-y-6'>
              {currentDoctors.length === 0 ? (
                <p className='text-center text-gray-600'>
                  Aucun rÃ©sultat trouvÃ©.
                </p>
              ) : (
                currentDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className='mb-6 overflow-hidden rounded-lg border border-blue-200'
                  >
                    <div className='flex flex-col md:flex-row'>
                      <div className='border-r border-blue-100 p-4 md:w-1/3'>
                        <div className='flex items-start gap-3'>
                          <div className='relative h-14 w-14'>
                            <Image
                              src={doctor.image ?? '/images/default.png'}
                              alt={doctor.nom}
                              width={56}
                              height={56}
                              className='rounded-full object-cover'
                            />
                            <div className='absolute right-0 bottom-0'>
                              <span className='text-blue-500'>
                                <svg
                                  xmlns='http://www.w3.org/2000/svg'
                                  viewBox='0 0 24 24'
                                  fill='currentColor'
                                  className='h-4 w-4'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                          <div>
                            <Link
                              href={`/doctor/${encodeURIComponent(doctor.id)}`}
                            >
                              <h3 className='hover:text-primary cursor-pointer text-lg font-bold text-black'>
                                Dr {doctor.nom}
                              </h3>
                            </Link>
                            <p className='text-gray-800'>{doctor.specialite}</p>
                          </div>
                        </div>

                        <div className='mt-4 space-y-2 text-gray-800'>
                          <p className='flex items-center'>
                            <MapPinIcon className='mr-2 h-5 w-5 text-gray-500' />
                            {doctor.location}
                          </p>
                        </div>
                      </div>

                      <div className='bg-gray-50 p-4 md:w-2/3'>
                        <div className='flex items-center justify-center p-4 text-center'>
                          <div className='flex w-full flex-col items-center gap-4'>
                            <p className='text-gray-700'>
                              {doctor.acceptsNewPatients === false
                                ? 'Ce soignant rÃ©serve la prise de rendez-vous en ligne aux patients dÃ©jÃ  suivis.'
                                : 'Cliquez sur le bouton ci-dessous pour voir les disponibilitÃ©s et prendre rendez-vous.'}
                            </p>

                            {doctor.acceptsNewPatients !== false && (
                              <button
                                onClick={() => {
                                  const formattedDoctor = {
                                    id: doctor.id,
                                    nom: doctor.nom,
                                    specialite: {
                                      id: '1',
                                      nom: doctor.specialite,
                                    },
                                    ville: { id: '1', nom: doctor.location },
                                  };
                                  setSelectedDoctor(formattedDoctor);
                                  setShowReservationModal(true);
                                }}
                                className='bg-primary hover:bg-primary-700 w-full max-w-xs rounded-lg px-6 py-2 font-medium text-white transition-colors'
                              >
                                Voir les disponibilitÃ©s
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredDoctors.length > doctorsPerPage && (
              <div className='mt-4 flex items-center justify-between'>
                <button
                  onClick={goToPreviousPage}
                  className='text-primary hover:text-primary-700 flex items-center rounded-lg px-4 py-2'
                  disabled={currentPage === 1}
                >
                  <span className='mr-2'>â†</span> PrÃ©cÃ©dent
                </button>
                <span className='text-gray-600'>
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  className='text-primary hover:text-primary-700 flex items-center rounded-lg px-4 py-2'
                  disabled={currentPage === totalPages}
                >
                  Suivant <span className='ml-2'>â†’</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />

      {selectedDoctor && (
        <ReservationModal
          doctor={selectedDoctor}
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
        />
      )}
    </div>
  );
}
