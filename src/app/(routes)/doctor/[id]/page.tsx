'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPinIcon } from '@heroicons/react/24/solid';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

interface Doctor {
  id: string;
  nom: string;
  adresse?: string;
  specialite: {
    id: string;
    nom: string;
  };
  ville: {
    id: string;
    nom: string;
    region?: string;
  };
}

export default function DoctorProfilePage() {
  const params = useParams();
  const doctorId = decodeURIComponent(params.id as string);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/doctors/${doctorId}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error ?? 'Une erreur est survenue');
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
        setError(
          'Une erreur est survenue lors de la récupération des informations du médecin'
        );
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className='my-12 flex justify-center'>
          <div className='border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2'></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className='my-12 text-center'>
          <p className='text-red-500'>{error}</p>
          <p className='mt-4'>
            Veuillez réessayer ultérieurement ou contacter le support.
          </p>
        </div>
      );
    }

    if (doctor) {
      return (
        <div className='my-8'>
          <div className='rounded-lg bg-white p-6 shadow-md'>
            <div className='flex flex-col items-start gap-6 md:flex-row'>
              <div className='relative h-24 w-24 md:h-32 md:w-32'>
                <Image
                  src='/images/default.png'
                  alt={doctor.nom}
                  width={128}
                  height={128}
                  className='rounded-full object-cover'
                />
              </div>
              <div className='flex-1'>
                <h1 className='mb-2 text-2xl font-bold text-black md:text-3xl'>
                  Dr. {doctor.nom}
                </h1>
                <p className='mb-2 text-lg text-gray-800'>
                  {doctor.specialite.nom}
                </p>
                <div className='mb-4 flex items-center gap-2 text-gray-700'>
                  <MapPinIcon className='h-5 w-5 text-gray-600' />
                  <p>
                    {doctor.ville.nom}
                    {doctor.ville.region ? `, ${doctor.ville.region}` : ''}
                  </p>
                </div>
                {doctor.adresse && (
                  <div className='mb-4'>
                    <h3 className='mb-1 font-semibold text-gray-800'>
                      Adresse
                    </h3>
                    <p className='text-gray-700'>{doctor.adresse}</p>
                  </div>
                )}
                <div className='mt-6'>
                  <button className='bg-primary hover:bg-primary-700 rounded-lg px-6 py-2 font-medium text-white transition-colors'>
                    Prendre rendez-vous
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className='my-12 text-center'>
        <p className='text-gray-700'>Médecin non trouvé</p>
      </div>
    );
  };

  return (
    <div className='flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white'>
      <Header />
      <div className='container mx-auto flex max-w-6xl flex-grow flex-col p-4'>
        {renderContent()}
      </div>
      <Footer />
    </div>
  );
}
