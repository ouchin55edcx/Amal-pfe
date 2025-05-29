'use client';

import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

export interface Proche {
  id: string;
  prenom: string;
  nom: string;
  photoProfil?: string;
}

export interface Gerant {
  photoProfil: string;
  prenom: string;
  nom: string;
}

export interface Droits {
  peutModifierProfil: boolean;
  peutGererRendezVous: boolean;
  peutGererDocuments: boolean;
}

type GestionDroitModalProps = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  proche: Proche;
  gerant: Gerant;
  droits: Droits;
}>;

export default function GestionDroitModal({
  isOpen,
  onClose,
  proche,
  gerant,
  droits,
}: GestionDroitModalProps) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-500 hover:text-gray-700'
        >
          <FaTimes />
        </button>

        <h2 className='mb-2 text-xl font-semibold text-gray-800'>
          Gérer les droits d'accès
        </h2>

        <p className='mb-4 text-sm font-medium text-gray-700'>
          Droits d'accès pour{' '}
          <span className='font-semibold'>
            {proche.prenom} {proche.nom}
          </span>
        </p>

        <div className='mb-6 flex items-center space-x-4 rounded-lg border border-gray-200 bg-gray-50 p-4'>
          <img
            src={gerant.photoProfil}
            alt={`${gerant.prenom} ${gerant.nom}`}
            className='h-12 w-12 rounded-full object-cover'
          />
          <div>
            <p className='text-sm font-medium text-gray-900'>
              {gerant.prenom} {gerant.nom}{' '}
              <span className='text-xs text-gray-500'>(moi)</span>
            </p>
          </div>
        </div>

        <div className='mb-6'>
          <p className='mb-2 font-medium'>Cette personne peut :</p>
          <ul className='space-y-3'>
            {droits.peutGererRendezVous && (
              <li className='flex items-center gap-2'>
                <div className='bg-primary flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white'>
                  <FaCheck className='h-2 w-2' />
                </div>
                <span className='text-sm leading-tight text-gray-700'>
                  Réserver, reporter et annuler tous les rendez‑vous
                </span>
              </li>
            )}
            {droits.peutGererDocuments && (
              <li className='flex items-center gap-2'>
                <div className='bg-primary flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white'>
                  <FaCheck className='h-2 w-2' />
                </div>
                <span className='text-sm leading-tight text-gray-700'>
                  Ajouter et gérer tous les documents
                </span>
              </li>
            )}
            {droits.peutModifierProfil && (
              <li className='flex items-center gap-2'>
                <div className='bg-primary flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white'>
                  <FaCheck className='h-2 w-2' />
                </div>
                <span className='text-sm leading-tight text-gray-700'>
                  Mettre à jour les informations d'identité et de contact
                </span>
              </li>
            )}
            {!droits.peutModifierProfil && (
              <li className='text-sm text-gray-500'>
                Vous ne pouvez pas modifier son profil car il a déjà un compte.
              </li>
            )}
          </ul>
        </div>

        {droits.peutModifierProfil &&
          droits.peutGererRendezVous &&
          droits.peutGererDocuments && (
            <div className='border-t pt-4'>
              <p className='mb-3 text-sm text-gray-600'>
                Vous occupez-vous de {proche.prenom} avec quelqu'un d'autre ?
              </p>
              <button className='bg-primary hover:bg-primary rounded-md px-4 py-2 text-white'>
                Envoyer une invitation
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
