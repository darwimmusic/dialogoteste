import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { Theme, Course, Lesson, Attachment } from '../types';

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
