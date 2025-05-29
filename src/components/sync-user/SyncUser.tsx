'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

interface Profile {
  prenom: string;
  nom: string;
  email: string;
}

const SyncUser = () => {
  const { user, isLoaded } = useUser();
  const lastProfileRef = useRef<Profile | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const currentProfile: Profile = {
      prenom: user.firstName ?? '',
      nom: user.lastName ?? '',
      email: user.primaryEmailAddress?.emailAddress ?? '',
    };

    const last = lastProfileRef.current;
    const hasChanged =
      !last ||
      last.prenom !== currentProfile.prenom ||
      last.nom !== currentProfile.nom ||
      last.email !== currentProfile.email;

    if (hasChanged) {
      const syncUser = async () => {
        try {
          // 1️⃣ Update Clerk directement
          await user.update({
            firstName: currentProfile.prenom,
            lastName: currentProfile.nom,
            // pour l'email on met juste à jour la primaire si nécessaire
            ...(currentProfile.email && {
              primaryEmailAddressId: user.primaryEmailAddress?.id,
            }),
          });

          // 2️⃣ Recharge le user chez Clerk (pour forcer la mise à jour du cache)
          await user.reload();

          // 3️⃣ Envoie vers ta BDD locale
          const response = await fetch('/api/sync-user', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentProfile),
          });

          if (!response.ok) {
            console.warn('Erreur lors de la synchronisation locale');
            return;
          }

          console.log('Utilisateur synchronisé avec succès');
          lastProfileRef.current = currentProfile;
        } catch (err) {
          console.warn('Erreur lors de la sync Clerk→API', err);
        }
      };

      syncUser();
    }
  }, [
    isLoaded,
    user?.firstName,
    user?.lastName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  return null;
};

export default SyncUser;
