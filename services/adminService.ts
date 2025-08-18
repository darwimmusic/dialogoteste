// src/services/adminService.ts - Versão Definitiva e Consolidada

import { 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp, 
  query, 
  where,
  doc,
  updateDoc
} from "firebase/firestore"; 
import { db } from './firebase';
import type { Theme, Course, Lesson, Attachment } from '../types';

// Interfaces para os dados de entrada
export interface ThemeInput {
  title: string;
  description: string;
}

export interface CourseInput {
    title: string;
    description: string;
    coverImageUrl: string;
    themeId: string;
}

export interface LessonInput {
    title: string;
    videoUrl: string;
    transcript: string;
    attachments?: Attachment[];
}

// --- Funções de Leitura (GET) ---

export const getThemes = async (): Promise<(Theme & { id: string })[]> => {
    try {
        const themesCollection = collection(db, "themes");
        const themeSnapshot = await getDocs(themesCollection);
        return themeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme & { id: string }));
    } catch (error) {
        console.error("Erro ao buscar temas: ", error);
        throw new Error("Não foi possível buscar os temas do banco de dados.");
    }
};

export const getCoursesForTheme = async (themeId: string): Promise<(Course & { id: string })[]> => {
    try {
        const coursesCollection = collection(db, "courses");
        const q = query(coursesCollection, where("themeId", "==", themeId));
        const courseSnapshot = await getDocs(q);
        return courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course & { id: string }));
    } catch (error) {
        console.error("Erro ao buscar cursos para o tema: ", error);
        throw new Error("Não foi possível buscar os cursos.");
    }
};

export const getLessonsForCourse = async (courseId: string): Promise<(Lesson & { id: string })[]> => {
    try {
        const lessonsCollection = collection(db, "courses", courseId, "lessons");
        const lessonSnapshot = await getDocs(lessonsCollection);
        return lessonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson & { id: string }));
    } catch (error) {
        console.error("Erro ao buscar aulas para o curso: ", error);
        throw new Error("Não foi possível buscar as aulas.");
    }
};

export const getAllCourses = async (): Promise<(Course & { id: string })[]> => {
    try {
        const coursesCollection = collection(db, "courses");
        const courseSnapshot = await getDocs(coursesCollection);
        return courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course & { id: string }));
    } catch (error) {
        console.error("Erro ao buscar todos os cursos: ", error);
        throw new Error("Não foi possível buscar todos os cursos.");
    }
};

// --- Funções de Escrita (CREATE / UPDATE) ---

export const createTheme = async (themeData: ThemeInput): Promise<void> => {
  try {
    const themesCollection = collection(db, "themes");
    await addDoc(themesCollection, {
      ...themeData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao criar tema: ", error);
    throw new Error("Não foi possível criar o tema.");
  }
};

export const createCourse = async (courseData: CourseInput): Promise<void> => {
    try {
        const coursesCollection = collection(db, "courses");
        await addDoc(coursesCollection, {
            ...courseData,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Erro ao criar curso: ", error);
        throw new Error("Não foi possível criar o curso.");
    }
};

export const createLesson = async (courseId: string, lessonData: LessonInput): Promise<void> => {
    try {
        const lessonsCollection = collection(db, "courses", courseId, "lessons");
        await addDoc(lessonsCollection, {
            ...lessonData,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Erro ao criar aula: ", error);
        throw new Error("Não foi possível criar a aula.");
    }
};

export const updateLessonAttachments = async (courseId: string, lessonId: string, attachments: Attachment[]): Promise<void> => {
    try {
        const lessonRef = doc(db, "courses", courseId, "lessons", lessonId);
        await updateDoc(lessonRef, { attachments });
    } catch (error) {
        console.error("Erro ao atualizar anexos da aula: ", error);
        throw new Error("Não foi possível salvar os anexos da aula.");
    }
};

export const updateCourseFeaturedStatus = async (courseId: string, isFeatured: boolean): Promise<void> => {
    try {
        const courseRef = doc(db, "courses", courseId);
        await updateDoc(courseRef, { isFeatured });
    } catch (error) {
        console.error("Erro ao atualizar o status de destaque do curso: ", error);
        throw new Error("Não foi possível atualizar o status de destaque.");
    }
};
