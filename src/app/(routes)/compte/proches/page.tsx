'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  FaChevronLeft,
  FaUsers,
  FaEdit,
  FaTrash,
  FaCamera,
  FaExclamationTriangle,
  FaCheck,
} from 'react-icons/fa';
import { IoMdPersonAdd } from 'react-icons/io';
import Header from '@/components/compte-patient/Header';
import Footer from '@/components/landing/Footer';
import GestionDroitModal from '@/components/compte-patient/GestionDroitModel';
import ConfirmationModal from '@/components/compte-patient/ConfirmationDeleteProche';
import toast, { Toaster } from 'react-hot-toast';

type ProcheProfil = {
  photoProfil?: string;
  sexe: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  lieuNaissance: string;
  telephone: string;
  email: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  cin?: string;
};

type Proche = {
  id: number;
  compteExiste: boolean;
  profil: ProcheProfil;
  droits: {
    peutModifierProfil: boolean;
    peutGererRendezVous: boolean;
    peutGererDocuments: boolean;
  };
};

type State = {
  showForm: boolean;
  proches: Proche[];
  phoneVerified: boolean;
  emailVerified: boolean;
  showVerificationAlert: boolean;
  loading: boolean;
  legalRepresentative: boolean;
  newProche: ProcheProfil;
  errors: Partial<Record<keyof ProcheProfil | 'legalRepresentative', string>>;
};

const initialProcheState: ProcheProfil = {
  photoProfil: '',
  sexe: 'Homme',
  prenom: '',
  nom: '',
  dateNaissance: '',
  lieuNaissance: '',
  telephone: '',
  email: '',
  adresse: '',
  codePostal: '',
  ville: '',
};

//formatage des infos de proches
function formatBirthInfo(profil: ProcheProfil): string {
  const formattedDate = profil.dateNaissance
    ? new Date(profil.dateNaissance).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Date non renseignée';

  let lieu: string;
  if (profil.lieuNaissance) {
    lieu = `à ${profil.lieuNaissance}`;
  } else if (profil.ville) {
    const codePostalPart = profil.codePostal ? ` (${profil.codePostal})` : '';
    lieu = `à ${profil.ville}${codePostalPart}`;
  } else {
    lieu = '(Lieu non renseigné)';
  }

  const adresse = profil.adresse ? `, ${profil.adresse}` : '';
  return `Né(e) le ${formattedDate} ${lieu}${adresse}`;
}

export default function MesProchesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [state, setState] = useState<State>({
    showForm: false,
    proches: [],
    phoneVerified: true,
    emailVerified: true,
    showVerificationAlert: false,
    loading: true,
    legalRepresentative: false,
    newProche: initialProcheState,
    errors: {},
  });
  const [editingProche, setEditingProche] = useState<Proche | null>(null);
  const [selectedProche, setSelectedProche] = useState<Proche | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    procheId: number | null;
    procheName: string;
  }>({ isOpen: false, procheId: null, procheName: '' });

  useEffect(() => {
    if (user) fetchProches();
  }, [user]);

  async function fetchProches() {
    try {
      const res = await fetch('/api/proches');
      if (!res.ok) throw new Error();
      const data: Proche[] = await res.json();
      setState((prev) => ({ ...prev, proches: data, loading: false }));
    } catch {
      toast.error('Impossible de charger vos proches');
      setState((prev) => ({ ...prev, loading: false }));
    }
  }

  function handleAddProche() {
    if (!state.phoneVerified || !state.emailVerified) {
      setState((prev) => ({ ...prev, showVerificationAlert: true }));
      return;
    }
    setEditingProche(null);
    setState((prev) => ({
      ...prev,
      showForm: true,
      showVerificationAlert: false,
      newProche: initialProcheState,
      errors: {},
    }));
  }

  function handleEditProche(p: Proche) {
    setEditingProche(p);
    setState((prev) => ({
      ...prev,
      showForm: true,
      newProche: {
        ...p.profil,
        dateNaissance: p.profil.dateNaissance.split('T')[0],
      },
      errors: {},
    }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState((prev) => ({
          ...prev,
          newProche: {
            ...prev.newProche,
            photoProfil: reader.result as string,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleInputChange(field: keyof ProcheProfil, value: string) {
    setState((prev) => ({
      ...prev,
      newProche: { ...prev.newProche, [field]: value },
      errors: { ...prev.errors, [field]: '' },
    }));
  }

  function validateForm() {
    const errs: State['errors'] = {};
    const np = state.newProche;
    if (!np.prenom) errs.prenom = 'Le prénom est requis';
    if (!np.nom) errs.nom = 'Le nom est requis';
    if (!np.dateNaissance) errs.dateNaissance = 'Date de naissance requise';
    if (!/^\d{10}$/.test(np.telephone))
      errs.telephone = 'Numéro invalide (10 chiffres requis)';
    if (!state.legalRepresentative)
      errs.legalRepresentative = 'Confirmation requise';
    setState((prev) => ({ ...prev, errors: errs }));
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const method = editingProche ? 'PUT' : 'POST';
      const url = editingProche
        ? `/api/proches/${editingProche.id}`
        : '/api/proches';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...state.newProche,
          dateNaissance: new Date(state.newProche.dateNaissance).toISOString(),
        }),
      });
      if (!res.ok) throw new Error();
      const saved: Proche = await res.json();
      setState((prev) => ({
        ...prev,
        proches: editingProche
          ? prev.proches.map((p) => (p.id === saved.id ? saved : p))
          : [...prev.proches, saved],
        showForm: false,
        newProche: initialProcheState,
        legalRepresentative: false,
        errors: {},
      }));
      setEditingProche(null);
      toast.success(editingProche ? 'Proche modifié' : 'Proche ajouté');
    } catch {
      toast.error('Une erreur est survenue');
    }
  }

  function handleCancel() {
    setEditingProche(null);
    setState((prev) => ({
      ...prev,
      showForm: false,
      newProche: initialProcheState,
      errors: {},
      legalRepresentative: false,
    }));
  }

  function handleDeleteProche(p: Proche) {
    setDeleteConfirmation({
      isOpen: true,
      procheId: p.id,
      procheName: `${p.profil.prenom} ${p.profil.nom}`,
    });
  }

  async function handleConfirmDelete(): Promise<boolean> {
    const id = deleteConfirmation.procheId;
    if (!id) return false;
    try {
      const res = await fetch(`/api/proches/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setState((prev) => ({
        ...prev,
        proches: prev.proches.filter((p) => p.id !== id),
      }));
      toast.success('Proche supprimé avec succès');
      return true;
    } catch {
      toast.error('Échec de la suppression');
      return false;
    } finally {
      setDeleteConfirmation({ isOpen: false, procheId: null, procheName: '' });
    }
  }

  if (state.loading) {
    return (
      <div className='flex min-h-screen flex-col'>
        <Header />
        <div className='flex flex-1 items-center justify-center'>
          <p>Chargement...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col bg-gray-50'>
      <Header />
      <div className='mx-auto w-full max-w-4xl p-6 pt-16'>
        <button
          onClick={() => router.push('/compte')}
          className='text-secondary flex items-center text-lg'
        >
          <FaChevronLeft className='mr-4 text-gray-400' /> Mon compte
        </button>
        <div className='mt-4 mb-8 flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-800'>Mes proches</h1>
          {!state.showForm && (
            <button
              onClick={handleAddProche}
              className='bg-secondary hover:bg-secondary-dark flex items-center gap-2 rounded-lg px-4 py-2 text-white shadow'
            >
              <IoMdPersonAdd className='text-lg' />{' '}
              <span>AJOUTER UN PROCHE</span>
            </button>
          )}
        </div>

        {state.showVerificationAlert && (
          <div className='mb-6 rounded border-l-4 border-yellow-400 bg-yellow-50 p-4'>
            <div className='flex items-center'>
              <FaExclamationTriangle className='h-5 w-5 text-yellow-400' />
              <p className='ml-3 text-sm text-yellow-700'>
                Vous devez vérifier votre email et téléphone avant d'ajouter un
                proche.
              </p>
            </div>
          </div>
        )}

        {state.showForm && (
          <form
            onSubmit={handleSubmit}
            className='mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-md'
          >
            <h2 className='mb-6 text-xl font-semibold text-gray-800'>
              {editingProche ? 'Modifier un proche' : 'Ajouter un proche'}
            </h2>
            <div className='mb-6 flex justify-center'>
              <label htmlFor='photoProfil' className='relative cursor-pointer'>
                <div className='relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-2xl font-bold text-white'>
                  {state.newProche.photoProfil ? (
                    <img
                      src={state.newProche.photoProfil}
                      alt=''
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <span className='text-4xl text-gray-500'>+</span>
                  )}

                  <div className='bg-opacity-30 absolute inset-0 flex items-center justify-center rounded-full bg-black/15 opacity-0 transition-opacity hover:opacity-100'>
                    <FaCamera className='text-xl text-white' />
                  </div>
                </div>
                <input
                  type='file'
                  id='photoProfil'
                  onChange={handlePhotoChange}
                  className='hidden'
                  accept='image/*'
                />
              </label>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {[
                { id: 'sexe', type: 'select', options: ['Homme', 'Femme'] },
                { id: 'prenom', type: 'text' },
                { id: 'nom', type: 'text' },
                { id: 'dateNaissance', type: 'date' },
                { id: 'telephone', type: 'tel' },
                { id: 'email', type: 'email' },
                { id: 'lieuNaissance', type: 'text' },
                { id: 'adresse', type: 'text' },
                { id: 'codePostal', type: 'text' },
                { id: 'ville', type: 'text' },
              ].map(({ id, type, options }) => (
                <div key={id} className='mb-4'>
                  <label
                    htmlFor={id}
                    className='block text-sm font-medium text-gray-700'
                  >
                    {id.split(/(?=[A-Z])/).join(' ')}
                  </label>
                  {type === 'select' ? (
                    <select
                      id={id}
                      value={state.newProche[id as keyof ProcheProfil] ?? ''}
                      onChange={(e) =>
                        handleInputChange(
                          id as keyof ProcheProfil,
                          e.target.value
                        )
                      }
                      className='focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm'
                    >
                      {options!.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={id}
                      type={type}
                      value={state.newProche[id as keyof ProcheProfil] ?? ''}
                      onChange={(e) =>
                        handleInputChange(
                          id as keyof ProcheProfil,
                          e.target.value
                        )
                      }
                      disabled={id === 'email' && !!editingProche}
                      className='focus:border-primary focus:ring-primary mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm'
                    />
                  )}
                  {state.errors[id as keyof State['errors']] && (
                    <p className='mt-1 text-sm text-red-500'>
                      {state.errors[id as keyof State['errors']]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className='mt-6 mb-6'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={state.legalRepresentative}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      legalRepresentative: e.target.checked,
                    }))
                  }
                  className='text-primary focus:ring-primary mr-2 h-4 w-4 rounded border-gray-300'
                />
                <span className='text-sm text-gray-700'>
                  Je déclare être le représentant légal de mon proche.
                </span>
              </label>
              {state.errors.legalRepresentative && (
                <p className='mt-1 text-sm text-red-500'>
                  {state.errors.legalRepresentative}
                </p>
              )}
            </div>

            <div className='flex justify-end space-x-4'>
              <button
                type='button'
                onClick={handleCancel}
                className='rounded-md bg-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-400'
              >
                Annuler
              </button>
              <button
                type='submit'
                className='bg-secondary hover:bg-secondary-dark rounded-md px-4 py-2 text-white transition'
              >
                {editingProche ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </form>
        )}

        {state.proches.length > 0 ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {state.proches.map((proche) => (
              <div
                key={proche.id}
                className='rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md'
              >
                <div className='flex items-start space-x-4'>
                  <div className='flex-shrink-0'>
                    {proche.profil.photoProfil ? (
                      <img
                        src={proche.profil.photoProfil}
                        alt={`${proche.profil.prenom} ${proche.profil.nom}`}
                        className='h-16 w-16 rounded-full object-cover'
                      />
                    ) : (
                      <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500'>
                        <FaUsers className='text-2xl' />
                      </div>
                    )}
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-medium text-gray-900'>
                      {proche.profil.prenom} {proche.profil.nom}
                    </h3>
                    {!proche.compteExiste && (
                      <span className='inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-black'>
                        Enfant
                      </span>
                    )}
                    <p className='mt-2 text-sm text-gray-500'>
                      {formatBirthInfo(proche.profil)}
                    </p>
                    <p className='mt-1 text-sm text-gray-500'>
                      {proche.profil.telephone}
                    </p>
                    {proche.profil.email && (
                      <p className='mt-1 text-sm text-gray-500'>
                        {proche.profil.email}
                      </p>
                    )}
                    {proche.compteExiste && (
                      <p className='mt-1 text-sm text-gray-500'>
                        <FaCheck className='mr-1 inline' />
                        <b> ce proche a un compte Beedical </b>
                      </p>
                    )}
                  </div>
                  <div className='flex space-x-2'>
                    {!proche.compteExiste && (
                      <button onClick={() => handleEditProche(proche)}>
                        <FaEdit className='text-primary' />
                      </button>
                    )}
                    <button onClick={() => handleDeleteProche(proche)}>
                      <FaTrash className='text-secondary transition-colors hover:text-red-500' />
                    </button>
                  </div>
                </div>
                <div className='mt-4 border-t border-gray-100 pt-4 text-center'>
                  <button
                    onClick={() => setSelectedProche(proche)}
                    className='text-secondary hover:text-secondary-dark text-sm font-medium'
                  >
                    Gérer les droits d'accès
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !state.showForm && (
            <div className='mt-12 py-12 text-center'>
              <FaUsers className='mx-auto mb-4 text-4xl text-gray-400' />
              <h3 className='text-xl font-medium text-gray-700'>
                Aucun proche ajouté
              </h3>
              <p className='text-gray-500'>
                Commencez par ajouter un proche pour gérer ses rendez-vous
              </p>
            </div>
          )
        )}

        {selectedProche && (
          <GestionDroitModal
            isOpen
            onClose={() => setSelectedProche(null)}
            proche={{
              id: selectedProche.id.toString(),
              photoProfil: selectedProche.profil.photoProfil ?? '',

              prenom: selectedProche.profil.prenom,
              nom: selectedProche.profil.nom,
            }}
            gerant={{
              photoProfil: user?.imageUrl ?? '/default-avatar.png',
              prenom: user?.firstName ?? 'Vous',
              nom: user?.lastName ?? '',
            }}
            droits={selectedProche.droits}
          />
        )}

        {deleteConfirmation.isOpen && (
          <ConfirmationModal
            isOpen
            onClose={() =>
              setDeleteConfirmation({
                isOpen: false,
                procheId: null,
                procheName: '',
              })
            }
            onConfirm={handleConfirmDelete}
            title='Supprimer un proche'
            message={`Êtes-vous sûr de vouloir supprimer ${deleteConfirmation.procheName} ?`}
            confirmText='Supprimer'
            cancelText='Annuler'
          />
        )}
      </div>
      <Toaster position='top-center' />
      <Footer />
    </div>
  );
}
