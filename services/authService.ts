// services/authService.ts - Versão Refatorada para Firebase v9+

import {
  getAuth,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, googleProvider } from './firebase';
import type { User } from "firebase/auth";
import type { UserProfile } from "../types";

const db = getFirestore();

/**
 * Verifica um perfil de usuário no Firestore e cria um se não existir.
 * @param user O objeto de usuário autenticado do Firebase Auth.
 * @param additionalData Dados adicionais, como displayName do formulário de cadastro.
 */
export const createUserProfileDocument = async (user: User, additionalData: { displayName?: string } = {}) => {
  if (!user) return;

  const userRef = doc(db, `users/${user.uid}`);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, photoURL, uid } = user;
    const displayName = additionalData.displayName || user.displayName;
    const createdAt = serverTimestamp();

    try {
      const newUserProfile: UserProfile = {
        uid,
        displayName: displayName || 'Novo Usuário',
        email: email || '',
        photoURL: photoURL || '',
        createdAt,
        isAdmin: false,
        xp: 0,
        level: 1,
        title: 'Rookie',
        completedCourses: [],
        badges: [],
      };

      await setDoc(userRef, newUserProfile);

      // Atualiza também o perfil do Firebase Auth com o nome de exibição
      if (displayName) {
        await updateProfile(user, { displayName });
      }

    } catch (error) {
      console.error('Error creating user document', error);
      throw new Error('Não foi possível criar o perfil do usuário.');
    }
  }
};

/**
 * Realiza o login com Google e cria o perfil de usuário se necessário.
 */
export const signInWithGoogle = async (): Promise<void> => {
  try {
    const { user } = await signInWithPopup(auth, googleProvider);
    await createUserProfileDocument(user);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw new Error('Falha ao entrar com o Google. Por favor, tente novamente.');
  }
};

/**
 * Cadastra um novo usuário com e-mail, senha e nome de exibição.
 */
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<void> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfileDocument(user, { displayName });
  } catch (error: any) {
    console.error("Error signing up with email: ", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso.');
    }
    throw new Error('Falha ao criar conta.');
  }
};

/**
 * Realiza o login de um usuário existente com e-mail e senha.
 */
export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfileDocument(user); // Garante que o perfil exista
  } catch (error: any) {
    console.error("Error signing in with email: ", error);
     if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('E-mail ou senha inválidos.');
    }
    throw new Error('Falha ao fazer login.');
  }
};

/**
 * Realiza o logout do usuário atual.
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw new Error('Ocorreu um erro ao sair.');
  }
};
