import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import type { UserProfile, Course, Badge } from "../types";

const db = getFirestore();
const storage = getStorage();

// --- Lógica de Níveis e Títulos ---

const XP_PER_LESSON = 20;
const XP_TO_LEVEL_UP = 100;
const MAX_LEVEL = 50;

const TITLES: { [key: number]: string } = {
  1: "Ferro",
  5: "Bronze",
  10: "Prata",
  15: "Ouro",
  20: "Platina",
  25: "Esmeralda",
  30: "Diamante",
  35: "Mestre",
  40: "Grão-Mestre",
  45: "Campeão",
  50: "Campeão", // Nível máximo
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
    // Cria um perfil base com valores padrão para garantir consistência
    let userProfile = {
      uid: data.uid || uid,
      displayName: data.displayName || 'Usuário',
      email: data.email || '',
      xp: data.xp || 0,
      level: data.level || 1,
      title: data.title || 'Ferro',
      completedCourses: data.completedCourses || [],
      badges: data.badges || [],
      isAdmin: data.isAdmin || false,
      createdAt: data.createdAt || new Date(),
      ...data,
    } as UserProfile;

    // Busca a imagem da badge de título
    try {
      const titleBadgeRef = doc(db, 'title_badges', userProfile.title);
      const titleBadgeSnap = await getDoc(titleBadgeRef);
      if (titleBadgeSnap.exists()) {
        userProfile.titleBadgeUrl = titleBadgeSnap.data().imageUrl;
      }
    } catch (e) {
      console.error("Could not fetch title badge:", e);
      // Continua mesmo se a badge não for encontrada
    }

    // Se o usuário for admin, busca todas as badges existentes e as atribui a ele.
    if (userProfile.isAdmin) {
      const coursesCollection = collection(db, "courses");
      const courseSnapshot = await getDocs(coursesCollection);
      const allBadges = courseSnapshot.docs
        .map(doc => (doc.data() as Course).badge)
        .filter((badge): badge is Badge => badge !== undefined);
      userProfile.badges = allBadges;
    }

    return userProfile;
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
 * Processa a conclusão de uma aula, adicionando XP e prevenindo repetições.
 * @param uid O ID do usuário.
 * @param lessonId O ID da aula concluída.
 * @returns `true` se o XP foi concedido, `false` se a aula já havia sido concluída.
 */
export const completeLesson = async (uid: string, lessonId: string): Promise<boolean> => {
  const userRef = doc(db, `users/${uid}`);
  const userProfile = await getUserProfile(uid);

  if (!userProfile || userProfile.level >= MAX_LEVEL) {
    return false; // Não faz nada se o perfil não existir ou já estiver no nível máximo
  }

  // Verifica se a aula já foi concluída
  if (userProfile.completedLessons?.includes(lessonId)) {
    console.log(`Aula ${lessonId} já concluída pelo usuário ${uid}. Nenhum XP concedido.`);
    return false;
  }

  // Adiciona a aula à lista de concluídas
  const updatedCompletedLessons = [...(userProfile.completedLessons || []), lessonId];

  const newXp = (userProfile.xp % XP_TO_LEVEL_UP) + XP_PER_LESSON;
  const levelsGained = Math.floor(newXp / XP_TO_LEVEL_UP);

  const updates: { [key: string]: any } = {
    completedLessons: updatedCompletedLessons,
    xp: increment(XP_PER_LESSON),
  };

  if (levelsGained > 0) {
    const newLevel = Math.min(userProfile.level + levelsGained, MAX_LEVEL);
    const newTitle = getTitleForLevel(newLevel);
    updates.level = newLevel;
    if (newTitle && newTitle !== userProfile.title) {
      updates.title = newTitle;
    }
  }
  
  await updateDoc(userRef, updates);
  console.log(`Aula ${lessonId} concluída. ${XP_PER_LESSON} XP concedido ao usuário ${uid}.`);
  return true;
};

/**
 * Faz o upload da foto de perfil do usuário para o Firebase Storage.
 * @param uid O ID do usuário.
 * @param file O arquivo da imagem a ser carregado.
 * @returns A URL de download da imagem.
 */
export const uploadProfilePicture = async (uid: string, file: File): Promise<string> => {
  if (!file) throw new Error("Nenhum arquivo fornecido.");

  // Ajusta o caminho para corresponder às regras de segurança: /profile/avatar.jpg
  const filePath = `user_content/${uid}/profile/avatar.jpg`;
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

/**
 * Concede a badge de um curso a um usuário se ele ainda não a tiver.
 * Chamado após o usuário completar a última aula de um curso.
 * @param uid O ID do usuário.
 * @param courseId O ID do curso concluído.
 */
export const awardBadgeIfCourseCompleted = async (uid: string, courseId: string): Promise<void> => {
  const courseRef = doc(db, `courses/${courseId}`);
  const userRef = doc(db, `users/${uid}`);

  try {
    const [courseSnap, userSnap] = await Promise.all([getDoc(courseRef), getDoc(userRef)]);

    if (!courseSnap.exists() || !userSnap.exists()) {
      console.warn("Curso ou usuário não encontrado.");
      return;
    }

    const course = courseSnap.data() as Course;
    const userProfile = userSnap.data() as UserProfile;

    // Verifica se o curso tem uma badge e se o usuário já não a possui
    if (course.badge && !userProfile.badges?.some(b => b.id === course.badge!.id)) {
      const updatedBadges = [...(userProfile.badges || []), course.badge];
      await updateDoc(userRef, { badges: updatedBadges });
      console.log(`Badge "${course.badge.name}" concedida ao usuário ${uid}.`);
    }
  } catch (error) {
    console.error("Erro ao conceder a badge: ", error);
    // Não lançamos o erro para não interromper o fluxo do usuário
  }
};
