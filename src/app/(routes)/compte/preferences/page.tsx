'use client';
import { useState } from 'react';
import {
  FaChevronLeft,
  FaCogs,
  FaMapMarkedAlt,
  FaBell,
  FaCookieBite,
  FaHistory,
  FaFileMedical,
  FaHeartbeat,
  FaChartLine,
  FaChevronRight,
  FaCheck,
  FaTimes,
} from 'react-icons/fa';
import Header from '@/components/compte-patient/Header';
import Footer from '@/components/landing/Footer';
import { useRouter } from 'next/navigation';

type Preferences = {
  historique: boolean;
  medical: boolean;
  recommandations: boolean;
  personnalises: boolean;
  carte: boolean;
  notifications: {
    push: boolean;
    emails: boolean;
    conseilsPush: boolean;
    marketingPush: boolean;
    conseilsEmail: boolean;
    marketingEmail: boolean;
  };
  cookies: {
    necessaires: boolean;
    audience: boolean;
    prevention: boolean;
    contenus: boolean;
    publicite: boolean;
  };
  amelioration: boolean;
};

export default function PreferencesPage() {
  const [activePopup, setActivePopup] = useState<string | null>(null);

  const router = useRouter();

  const goBack = () => {
    router.push('/compte');
  };

  const [prefs, setPrefs] = useState<Preferences>({
    historique: false,
    medical: true,
    recommandations: false,
    personnalises: true,
    carte: true,
    notifications: {
      push: true,
      emails: true,
      conseilsPush: true,
      marketingPush: true,
      conseilsEmail: true,
      marketingEmail: true,
    },
    cookies: {
      necessaires: true,
      audience: true,
      prevention: true,
      contenus: true,
      publicite: false,
    },
    amelioration: true,
  });

  const togglePref = (path: string) => {
    setPrefs((prev) => {
      const parts = path.split('.');
      const newPrefs = JSON.parse(JSON.stringify(prev)); // Deep clone
      let current: any = newPrefs;

      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = !current[parts[parts.length - 1]];
      return newPrefs;
    });
  };

  const preferenceItems = [
    {
      id: 'services',
      title: 'Services personnalisés',
      icon: <FaCogs className='text-secondary' />,
      popup: (
        <div className='space-y-6'>
          <p className='mb-4 text-gray-600'>
            En activant ces services, vous pourrez :
          </p>

          <IconOption
            label='Consulter vos anciens rendez-vous'
            checked={prefs.historique}
            onChange={() => togglePref('historique')}
            icon={<FaHistory />}
          />
          <IconOption
            label='Enregistrer votre historique médical'
            checked={prefs.medical}
            onChange={() => togglePref('medical')}
            icon={<FaFileMedical />}
          />
          <IconOption
            label='Recevoir des recommandations santé'
            checked={prefs.recommandations}
            onChange={() => togglePref('recommandations')}
            icon={<FaHeartbeat />}
          />

          <div className='space-y-3 pt-4'>
            <RadioOption
              label="J'active les services personnalisés"
              checked={prefs.personnalises}
              onChange={() => setPrefs((p) => ({ ...p, personnalises: true }))}
            />
            <RadioOption
              label='Je désactive les services personnalisés'
              checked={!prefs.personnalises}
              onChange={() => setPrefs((p) => ({ ...p, personnalises: false }))}
            />
          </div>

          <p className='mt-6 text-sm text-gray-500'>
            En activant ces services, vous acceptez le traitement de vos
            données.{' '}
            <span>
              <button className='text-secondary underline'>
                En savoir plus
              </button>
            </span>
          </p>
        </div>
      ),
    },
    {
      id: 'amelioration',
      title: 'Amélioration des services',
      icon: <FaChartLine className='text-secondary' />,
      popup: (
        <div className='space-y-6'>
          <p className='text-gray-600'>
            Participez à l'amélioration continue de nos services :
          </p>
          <ToggleOption
            label="Envoyer des données d'usage anonymisées"
            checked={prefs.amelioration}
            onChange={() => togglePref('amelioration')}
          />
          <p className='text-sm text-gray-500'>
            Ces données nous aident à améliorer l'expérience utilisateur.
          </p>
        </div>
      ),
    },
    {
      id: 'carte',
      title: 'Carte interactive',
      icon: <FaMapMarkedAlt className='text-secondary' />,
      popup: (
        <div className='space-y-6'>
          <p className='text-gray-600'>
            J'autorise le traitement de mon adresse IP par Google Maps
          </p>
          <RadioOption
            label='Afficher la carte'
            checked={prefs.carte}
            onChange={() => setPrefs((p) => ({ ...p, carte: true }))}
          />
          <RadioOption
            label='Masquer la carte'
            checked={!prefs.carte}
            onChange={() => setPrefs((p) => ({ ...p, carte: false }))}
          />
        </div>
      ),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <FaBell className='text-secondary' />,
      popup: (
        <div className='space-y-6'>
          <ToggleOption
            label='Notifications push'
            checked={prefs.notifications.push}
            onChange={() => togglePref('notifications.push')}
          />

          {prefs.notifications.push && (
            <div className='space-y-4 pl-6'>
              <ToggleOption
                label='Conseils santé'
                checked={prefs.notifications.conseilsPush}
                onChange={() => togglePref('notifications.conseilsPush')}
                small
              />
              <ToggleOption
                label='Informations marketing'
                checked={prefs.notifications.marketingPush}
                onChange={() => togglePref('notifications.marketingPush')}
                small
              />
            </div>
          )}

          <ToggleOption
            label='E-mails'
            checked={prefs.notifications.emails}
            onChange={() => togglePref('notifications.emails')}
          />

          {prefs.notifications.emails && (
            <div className='space-y-4 pl-6'>
              <ToggleOption
                label='Conseils santé'
                checked={prefs.notifications.conseilsEmail}
                onChange={() => togglePref('notifications.conseilsEmail')}
                small
              />
              <ToggleOption
                label='Informations marketing'
                checked={prefs.notifications.marketingEmail}
                onChange={() => togglePref('notifications.marketingEmail')}
                small
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'cookies',
      title: 'Gestion des cookies',
      icon: <FaCookieBite className='text-secondary' />,
      popup: (
        <div className='space-y-6'>
          <p className='text-gray-600'>Nous utilisons des cookies pour :</p>

          <div className='space-y-4'>
            <ToggleOption
              label='Cookies nécessaires'
              checked={prefs.cookies.necessaires}
              onChange={() => togglePref('cookies.necessaires')}
              disabled
            />
            <ToggleOption
              label="Mesure d'audience"
              checked={prefs.cookies.audience}
              onChange={() => togglePref('cookies.audience')}
            />
            <ToggleOption
              label='Campagnes de prévention'
              checked={prefs.cookies.prevention}
              onChange={() => togglePref('cookies.prevention')}
            />
            <ToggleOption
              label='Personnalisation des contenus'
              checked={prefs.cookies.contenus}
              onChange={() => togglePref('cookies.contenus')}
            />
            <ToggleOption
              label='Publicités'
              checked={prefs.cookies.publicite}
              onChange={() => togglePref('cookies.publicite')}
            />
          </div>

          <p className='text-sm text-gray-500'>
            Pour plus d'informations, consultez notre{' '}
            <span className='inline-flex items-center'>
              <button className='text-secondary ml-1 underline'>
                Politique des cookies
              </button>
            </span>
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className='flex min-h-screen flex-col'>
      <Header />

      <main className='container mx-auto flex-grow px-4 py-8'>
        <div className='mx-auto max-w-3xl'>
          <button
            onClick={goBack}
            className='text-primary flex items-center text-lg'
          >
            <FaChevronLeft className='mr-4 text-gray-400' /> Retour
          </button>

          <h1 className='mt-6 mb-8 text-3xl font-bold text-gray-900'>
            Mes préférences
          </h1>

          <div className='divide-y divide-gray-200 rounded-lg bg-white shadow-sm'>
            {preferenceItems.map((item) => (
              <button
                key={item.id}
                className='w-full cursor-pointer p-6 text-left transition-colors hover:bg-gray-50'
                onClick={() => setActivePopup(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    setActivePopup(item.id);
                }}
                tabIndex={0}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-4'>
                    <div className='text-gray-400'>{item.icon}</div>
                    <h2 className='text-lg font-medium'>{item.title}</h2>
                  </div>
                  <FaChevronRight className='text-gray-400' />
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {activePopup && (
        <Popup
          title={preferenceItems.find((i) => i.id === activePopup)?.title ?? ''}
          onClose={() => setActivePopup(null)}
          onSave={() => setActivePopup(null)}
        >
          {preferenceItems.find((i) => i.id === activePopup)?.popup}
        </Popup>
      )}
    </div>
  );
}

// Nouveau composant
const IconOption = ({
  label,
  checked,
  onChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}) => (
  <button
    className='flex cursor-pointer items-center justify-between py-3'
    onClick={onChange}
  >
    <div className='flex items-center space-x-3'>
      <span className='text-gray-500'>{icon}</span>
      <span className='text-gray-700'>{label}</span>
    </div>
    {checked ? (
      <FaCheck className='text-aqua-500' />
    ) : (
      <FaTimes className='text-gold-300' />
    )}
  </button>
);

const RadioOption = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    className='flex cursor-pointer items-center space-x-3 py-2'
    onClick={onChange}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onChange();
    }}
  >
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
        checked ? 'border-secondary bg-secondary' : 'border-gray-300'
      }`}
    >
      {checked && <div className='h-2 w-2 rounded-full bg-white'></div>}
    </div>
    <span className='text-gray-700'>{label}</span>
  </button>
);

const ToggleOption = ({
  label,
  checked,
  onChange,
  disabled = false,
  small = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  small?: boolean;
}) => (
  <div
    className={`flex items-center justify-between ${small ? 'py-2' : 'py-3'}`}
  >
    <span
      className={`${disabled ? 'text-gray-400' : 'text-gray-700'} ${small ? 'text-sm' : ''}`}
    >
      {label}
    </span>
    <button
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className={`relative inline-flex items-center rounded-full transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${small ? 'h-5 w-9' : 'h-6 w-11'} ${
        checked ? 'bg-secondary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block transform rounded-full bg-white shadow-sm transition-transform ${
          small ? 'h-4 w-4' : 'h-5 w-5'
        } ${getTogglePosition(small, checked)}`}
      />
    </button>
  </div>
);

//avoid ternary
const getTogglePosition = (small: boolean, checked: boolean) => {
  if (!checked) return 'translate-x-0';
  return small ? 'translate-x-4' : 'translate-x-5';
};

const Popup = ({
  title,
  children,
  onClose,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm'>
    <div className='w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl'>
      <div className='p-6'>
        <h2 className='mb-6 text-xl font-bold'>{title}</h2>
        {children}
        <div className='mt-6 flex justify-between border-t border-gray-200 pt-4'>
          <button
            onClick={onClose}
            className='rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100'
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className='bg-secondary hover:bg-secondary-dark rounded-lg px-4 py-2 text-white'
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
);
