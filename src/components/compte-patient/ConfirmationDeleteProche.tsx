'use client';

import { FaExclamationTriangle } from 'react-icons/fa';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir effectuer ce proche de votre liste de proches ?',
  procheName = '',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  title?: string;
  message?: string;
  procheName?: string;
  confirmText?: string;
  cancelText?: string;
}>) {
  if (!isOpen) return null;

  return (
    <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
      <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
        <div className='flex items-start'>
          <div className='flex-shrink-0 pt-0.5'>
            <FaExclamationTriangle className='h-6 w-6 text-yellow-500' />
          </div>
          <div className='ml-4'>
            <h3 className='text-lg font-medium text-gray-900'>{title}</h3>
            <div className='mt-2'>
              <p className='text-sm text-gray-500'>
                {message}{' '}
                <span className='font-semibold text-red-600'>{procheName}</span>{' '}
                ?
              </p>
            </div>
            <div className='mt-4 flex justify-end space-x-3'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none'
              >
                {cancelText}
              </button>
              <button
                type='button'
                onClick={async () => {
                  await onConfirm();
                  onClose();
                }}
                className='rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none'
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
