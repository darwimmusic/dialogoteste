import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { Theme, Course, Lesson, Attachment, StandardAchievement } from '../types';

// --- Funções de Gerenciamento de Badges de Título ---

export interface TitleBadge {
  id: string;
  name: string;
  imageUrl: string;
}

export const getTitleBadges = async (): Promise<TitleBadge[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'title_badges'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TitleBadge));
  } catch (error) {
    console.error("Error fetching title badges:", error);
    throw new Error("Não foi possível carregar as badges de título.");
  }
};

export const updateTitleBadge = async (title: string, imageUrl: string): Promise<void> => {
  try {
    const docRef = doc(db, 'title_badges', title);
    await setDoc(docRef, { name: title, imageUrl }, { merge: true });
  } catch (error) {
    console.error("Error updating title badge:", error);
    throw new Error("Não foi possível salvar a badge de título.");
  }
};

// --- Funções de Gerenciamento de Conteúdo (Cursos, Temas, Aulas) ---

export const createTheme = async (themeData: Omit<Theme, 'id' | 'courses'>): Promise<void> => {
  await addDoc(collection(db, "themes"), themeData);
};

export const createCourse = async (courseData: Omit<Course, 'id' | 'lessons'>): Promise<void> => {
  await addDoc(collection(db, "courses"), courseData);
};

export const createLesson = async (courseId: string, lessonData: Omit<Lesson, 'id'>): Promise<void> => {
  await addDoc(collection(db, `courses/${courseId}/lessons`), lessonData);
};

export const getThemes = async (): Promise<(Theme & { id: string })[]> => {
  const themeSnapshot = await getDocs(collection(db, "themes"));
  return themeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme & { id: string }));
};

export const getCoursesForTheme = async (themeId: string): Promise<(Course & { id: string })[]> => {
  const q = query(collection(db, "courses"), where("themeId", "==", themeId));
  const courseSnapshot = await getDocs(q);
  return courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course & { id: string }));
};

export const getAllCourses = async (): Promise<(Course & { id: string })[]> => {
  const courseSnapshot = await getDocs(collection(db, "courses"));
  return courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course & { id: string }));
};

export const getLessonsForCourse = async (courseId: string): Promise<(Lesson & { id: string })[]> => {
  const lessonSnapshot = await getDocs(collection(db, `courses/${courseId}/lessons`));
  return lessonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson & { id: string }));
};

export const updateLessonAttachments = async (courseId: string, lessonId: string, attachments: Attachment[]): Promise<void> => {
  const lessonRef = doc(db, "courses", courseId, "lessons", lessonId);
  await updateDoc(lessonRef, { attachments });
};

export const updateCourseFeaturedStatus = async (courseId: string, isFeatured: boolean): Promise<void> => {
  const courseRef = doc(db, "courses", courseId);
  await updateDoc(courseRef, { isFeatured });
};

// --- Funções de Gerenciamento de Conquistas Padrão ---

export const getStandardAchievements = async (): Promise<StandardAchievement[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'standard_achievements'));
    return snapshot.docs.map(doc => doc.data() as StandardAchievement);
  } catch (error) {
    console.error("Error fetching standard achievements:", error);
    throw new Error("Não foi possível carregar as conquistas padrão.");
  }
};

export const createOrUpdateStandardAchievement = async (achievement: StandardAchievement): Promise<void> => {
  try {
    const docRef = doc(db, 'standard_achievements', achievement.id);
    await setDoc(docRef, achievement, { merge: true });
  } catch (error) {
    console.error("Error creating/updating standard achievement:", error);
    throw new Error("Não foi possível salvar a conquista padrão.");
  }
};

export const deleteStandardAchievement = async (achievementId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'standard_achievements', achievementId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting standard achievement:", error);
    throw new Error("Não foi possível deletar a conquista padrão.");
  }
};

export const seedInitialAchievements = async (): Promise<void> => {
  const achievements: Omit<StandardAchievement, "imageUrl">[] = [
    { id: "first_login", name: "Primeiro Login", description: "Você fez o seu primeiro login na plataforma.", xp: 10 },
    { id: "first_lesson_watched", name: "Primeira Aula Assistida", description: "Você assistiu à sua primeira aula.", xp: 10 },
    { id: "first_course_completed", name: "Primeiro Curso Completo", description: "Você completou o seu primeiro curso.", xp: 10 },
    { id: "first_live_lesson_watched", name: "Primeira Aula ao Vivo", description: "Você participou da sua primeira aula ao vivo.", xp: 10 },
    { id: "first_live_chat_message", name: "Mensagem no Chat ao Vivo", description: "Você enviou sua primeira mensagem no chat de uma aula ao vivo.", xp: 10 },
    { id: "first_transcript_download", name: "Download de Transcrição", description: "Você baixou a transcrição de uma aula pela primeira vez.", xp: 10 },
    { id: "first_course_search", name: "Pesquisa de Curso", description: "Você pesquisou por um curso pela primeira vez.", xp: 10 },
    { id: "first_ai_tutor_interaction", name: "Interação com Tutor IA", description: "Você interagiu com o tutor de IA pela primeira vez.", xp: 10 },
    { id: "first_forum_post", name: "Primeiro Post no Fórum", description: "Você criou o seu primeiro post no fórum.", xp: 10 },
    { id: "first_forum_comment", name: "Primeiro Comentário no Fórum", description: "Você respondeu a um tópico no fórum pela primeira vez.", xp: 10 },
    { id: "first_comment_like", name: "Curtida em Comentário", description: "Você curtiu um comentário no fórum pela primeira vez.", xp: 10 },
    { id: "first_news_read", name: "Primeira Notícia Lida", description: "Você leu a sua primeira notícia na plataforma.", xp: 10 },
    { id: "elo_ferro", name: "Elo Ferro", description: "Você alcançou o elo Ferro.", xp: 10 },
    { id: "elo_bronze", name: "Elo Bronze", description: "Você alcançou o elo Bronze.", xp: 10 },
    { id: "elo_prata", name: "Elo Prata", description: "Você alcançou o elo Prata.", xp: 10 },
    { id: "elo_ouro", name: "Elo Ouro", description: "Você alcançou o elo Ouro.", xp: 10 },
    { id: "elo_platina", name: "Elo Platina", description: "Você alcançou o elo Platina.", xp: 10 },
    { id: "elo_esmeralda", name: "Elo Esmeralda", description: "Você alcançou o elo Esmeralda.", xp: 10 },
    { id: "elo_diamante", name: "Elo Diamante", description: "Você alcançou o elo Diamante.", xp: 10 },
    { id: "elo_mestre", name: "Elo Mestre", description: "Você alcançou o elo Mestre.", xp: 10 },
    { id: "elo_grao_mestre", name: "Elo Grão-Mestre", description: "Você alcançou o elo Grão-Mestre.", xp: 10 },
    { id: "elo_campeao", name: "Elo Campeão", description: "Você alcançou o elo Campeão.", xp: 10 },
  ];

  for (const achievementData of achievements) {
    try {
      const docRef = doc(db, 'standard_achievements', achievementData.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, { ...achievementData, imageUrl: '' });
      }
    } catch (error) {
      console.error(`Erro ao popular a conquista "${achievementData.name}":`, error);
      throw new Error(`Falha ao popular a conquista "${achievementData.name}".`);
    }
  }
};
