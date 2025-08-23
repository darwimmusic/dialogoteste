// src/hooks/auth.ts - Versão Aprimorada com Consciência de Admin

// src/hooks/useAuth.ts - Versão Aprimorada com perfil de usuário e conquistas
import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase'; // Importa o 'db'
import { doc, onSnapshot } from 'firebase/firestore'; // Importa o 'onSnapshot'
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
    // Listener para o estado de autenticação
    const authUnsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const idTokenResult = await user.getIdTokenResult();
        setIsAdmin(idTokenResult.claims.admin === true);

        // Listener em tempo real para o perfil do usuário
        const userDocRef = doc(db, 'users', user.uid);
        const profileUnsubscribe = onSnapshot(userDocRef, async (snapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.data() as UserProfile;
            setUserProfile(profileData);

            // Concede a conquista de primeiro login se for um novo usuário
            const isNewUser = profileData.createdAt && (new Date().getTime() - profileData.createdAt.toDate().getTime()) < 5000;
            if (isNewUser) {
              // Verificação para evitar conceder a conquista múltiplas vezes se o perfil for atualizado rapidamente
              const loginAchievementAwarded = profileData.achievements?.some(a => a.id === 'first_login');
              if (!loginAchievementAwarded) {
                await grantAchievement(user.uid, 'first_login');
              }
            }
          } else {
            // Caso o perfil ainda não exista, pode ser criado aqui ou tratado como erro
            setUserProfile(null);
          }
          setLoading(false);
        });

        // Retorna a função de limpeza para o listener do perfil
        return () => profileUnsubscribe();
      } else {
        // Usuário está deslogado.
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Limpa o listener de autenticação quando o componente é desmontado
    return () => authUnsubscribe();
  }, []);

  return { user, userProfile, isAdmin, loading };
}
