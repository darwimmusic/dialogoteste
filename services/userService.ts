import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import type { UserProfile } from "../types";

const db = getFirestore();
const storage = getStorage();

// --- Lógica de Níveis e Títulos ---

const XP_PER_LESSON = 20;
const XP_TO_LEVEL_UP = 100;
const MAX_LEVEL = 50;

const TITLES: { [key: number]: string } = {
  1: "Rookie",
  5: "Junior",
  10: "Senior",
  15: "Amateur",
  20: "Semi-profissional",
  25: "Profissional",
  30: "Master",
  35: "Grand Master",
  40: "Semi-champion",
  45: "Champion",
  50: "Champion", // Nível máximo
};

/**
 * Calcula o novo título com base no nível.
 * @param level O nível atual do usuário.
 * @returns O novo título ou o título atual se não houver mudança.
 */
const getTitleForLevel = (level: number): string | null => {
  let newTitle = null;
  // Encontra o título mais recente que o usuário alcançou
  for (const levelThreshold in TITLES) {
    if (level >= parseInt(levelThreshold)) {
      newTitle = TITLES[levelThreshold];
    }
  }
  return newTitle;
};


// --- Funções do Serviço ---

/**
 * Busca o perfil de um usuário no Firestore, garantindo que os dados retornados sejam consistentes.
 * @param uid O ID do usuário.
 * @returns O perfil do usuário completo ou null se não encontrado.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, `users/${uid}`);
  const snapshot = await getDoc(userRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    // Garante que os campos de array obrigatórios existam para evitar erros de renderização.
    return {
      uid: data.uid || uid,
      displayName: data.displayName || 'Usuário',
      email: data.email || '',
      xp: data.xp || 0,
      level: data.level || 1,
      title: data.title || 'Iniciante',
      completedCourses: data.completedCourses || [],
      badges: data.badges || [],
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt || new Date(),
      ...data, // Mantém os outros campos que já existem
    } as UserProfile;
  } else {
    console.warn("No such user profile!");
    return null;
  }
};

/**
 * Atualiza os dados do perfil de um usuário.
 * @param uid O ID do usuário.
 * @param data Os dados a serem atualizados.
 */
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, `users/${uid}`);
  try {
    await updateDoc(userRef, data);
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw new Error("Não foi possível atualizar o perfil.");
  }
};

/**
 * Processa a conclusão de uma aula, adicionando XP e verificando se o usuário subiu de nível.
 * @param uid O ID do usuário.
 */
export const completeLesson = async (uid: string): Promise<void> => {
  const userRef = doc(db, `users/${uid}`);
  const userProfile = await getUserProfile(uid);

  if (!userProfile || userProfile.level >= MAX_LEVEL) {
    return; // Não faz nada se o perfil não existir ou já estiver no nível máximo
  }

  const newXp = (userProfile.xp % XP_TO_LEVEL_UP) + XP_PER_LESSON;
  const levelsGained = Math.floor(newXp / XP_TO_LEVEL_UP);

  if (levelsGained > 0) {
    const newLevel = Math.min(userProfile.level + levelsGained, MAX_LEVEL);
    const newTitle = getTitleForLevel(newLevel);
    
    const updates: { [key: string]: any } = {
      xp: increment(XP_PER_LESSON),
      level: newLevel,
    };

    if (newTitle && newTitle !== userProfile.title) {
      updates.title = newTitle;
    }
    
    await updateDoc(userRef, updates);

  } else {
    await updateDoc(userRef, {
      xp: increment(XP_PER_LESSON),
    });
  }
};

/**
 * Faz o upload da foto de perfil do usuário para o Firebase Storage.
 * @param uid O ID do usuário.
 * @param file O arquivo da imagem a ser carregado.
 * @returns A URL de download da imagem.
 */
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  if (!file) throw new Error("Nenhum arquivo fornecido.");

  const filePath = `users/${uid}/profile.jpg`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Atualiza a URL da foto no perfil do usuário no Firestore
    await updateUserProfile(uid, { photoURL: downloadURL });

    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture: ", error);
    throw new Error("Falha ao carregar a imagem de perfil.");
  }
};
