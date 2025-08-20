// src/hooks/auth.ts - Versão Aprimorada com Consciência de Admin

// src/hooks/useAuth.ts - Versão Aprimorada com perfil de usuário e conquistas
import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import type { User } from 'firebase/auth';
import { getUserProfile } from '../services/userService';
import { grantAchievement } from '../services/achievementService';
import type { UserProfile } from '../types';

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Usuário está logado.
        setUser(user);
        const idTokenResult = await user.getIdTokenResult();
        setIsAdmin(idTokenResult.claims.admin === true);

        // Busca o perfil do usuário no Firestore
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);

        // Concede a conquista de primeiro login se for um novo usuário
        if (profile) {
          // A conta foi criada nos últimos 5 segundos?
          const isNewUser = profile.createdAt && (new Date().getTime() - profile.createdAt.toDate().getTime()) < 5000;
          if (isNewUser) {
            await grantAchievement(user.uid, 'first_login');
          }
        }
      } else {
        // Usuário está deslogado.
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  return { user, userProfile, isAdmin, loading };
}
