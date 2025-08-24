import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import type { UserProfile, StandardAchievement, Badge } from "../types";
import { getUserProfile, addXp } from "./userService"; // Importa addXp
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

  const hasAchievement = userProfile.badges?.some(
    (badge) => badge.id === achievementId
  );
  if (hasAchievement) {
    return false; // Já tem, não faz nada.
  }

  const achievementRef = doc(db, "standard_achievements", achievementId);
  const achievementSnap = await getDoc(achievementRef);

  if (!achievementSnap.exists()) {
    console.error(`A conquista com ID ${achievementId} não foi encontrada.`);
    return false;
  }

  const achievement = achievementSnap.data() as StandardAchievement;
  const newBadge: Badge = {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    imageUrl: achievement.imageUrl,
  };

  // Lógica para evitar loop de XP em conquistas de elo
  const isEloAchievement = achievementId.startsWith("elo_");

  try {
    if (isEloAchievement) {
      // Conquistas de elo não concedem XP, apenas a badge.
      const userRef = doc(db, `users/${uid}`);
      await updateDoc(userRef, {
        badges: arrayUnion(newBadge),
      });
    } else {
      // Outras conquistas concedem XP e a badge através da função centralizada.
      await addXp(uid, achievement.xp, {
        badges: arrayUnion(newBadge),
      });
    }
    
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
