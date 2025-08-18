// src/hooks/auth.ts - Versão Aprimorada com Consciência de Admin

import { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import type { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Usuário está logado. Vamos verificar suas permissões.
        setUser(user);
        const idTokenResult = await user.getIdTokenResult();
        // Verificamos se a declaração personalizada 'admin' é verdadeira
        setIsAdmin(idTokenResult.claims.admin === true);
      } else {
        // Usuário está deslogado.
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Limpa o listener quando o componente é desmontado
    return () => unsubscribe();
  }, []);

  return { user, isAdmin, loading };
}
