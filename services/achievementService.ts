import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
} from "firebase/firestore";
import type { UserProfile, StandardAchievement, Badge } from "../types";
import { getUserProfile } from "./userService";
import eventEmitter from "../utils/eventEmitter";

const db = getFirestore();

/**
 * Concede uma conquista padrão a um usuário se ele ainda não a tiver.
 * @param uid O ID do usuário.
 * @param achievementId O ID da conquista a ser concedida.
 * @returns `true` se a conquista foi concedida, `false` caso contrário.
 */
export const grantAchievement = async (
  uid: string,
  achievementId: string
): Promise<boolean> => {
  const userProfile = await getUserProfile(uid);

  if (!userProfile) {
    console.warn(`Usuário ${uid} não encontrado. Não foi possível conceder a conquista ${achievementId}.`);
    return false;
  }

  // 1. Verifica se o usuário já possui a conquista
  const hasAchievement = userProfile.badges?.some(
    (badge) => badge.id === achievementId
  );
  if (hasAchievement) {
    console.log(
      `Usuário ${uid} já possui a conquista ${achievementId}. Nenhuma ação foi tomada.`
    );
    return false;
  }

  // 2. Busca os dados da conquista no Firestore
  const achievementRef = doc(db, "standard_achievements", achievementId);
  const achievementSnap = await getDoc(achievementRef);

  if (!achievementSnap.exists()) {
    console.error(`A conquista com ID ${achievementId} não foi encontrada no banco de dados.`);
    return false;
  }

  const achievement = achievementSnap.data() as StandardAchievement;

  // 3. Prepara a badge para ser adicionada ao perfil do usuário
  const newBadge: Badge = {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    imageUrl: achievement.imageUrl,
  };

  // 4. Atualiza o perfil do usuário
  const userRef = doc(db, `users/${uid}`);
  try {
    await updateDoc(userRef, {
      badges: arrayUnion(newBadge),
      xp: increment(achievement.xp),
    });
    console.log(`Conquista "${achievement.name}" concedida ao usuário ${uid}.`);
    eventEmitter.emit('achievementGranted', newBadge);
    return true;
  } catch (error) {
    console.error(
      `Erro ao conceder a conquista ${achievementId} para o usuário ${uid}:`,
      error
    );
    return false;
  }
};
