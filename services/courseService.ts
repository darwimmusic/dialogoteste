// src/services/courseService.ts - Versão Final

import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from './firebase';
import type { Theme, Course, Lesson } from '../types';

export const getFullContentHierarchy = async (): Promise<Theme[]> => {
  try {
    const themesCollection = collection(db, "themes");
    const coursesCollection = collection(db, "courses");
    const [themeSnapshot, courseSnapshot] = await Promise.all([ getDocs(themesCollection), getDocs(coursesCollection) ]);
    const themes = themeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Theme & { id: string }));
    let courses = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course & { id: string }));
    const coursesWithLessonsPromises = courses.map(async (course) => {
      const lessonsCollection = collection(db, "courses", course.id, "lessons");
      const lessonSnapshot = await getDocs(lessonsCollection);
      const lessons = lessonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson & { id: string }));
      return { ...course, lessons };
    });
    courses = await Promise.all(coursesWithLessonsPromises);
    return themes.map(theme => ({
      ...theme,
      courses: courses.filter(course => course.themeId === theme.id)
    }));
  } catch (error) {
    console.error("Erro ao buscar a hierarquia de conteúdo: ", error);
    throw new Error("Não foi possível carregar o conteúdo da plataforma.");
  }
};

export const getCourseWithLessons = async (courseId: string): Promise<Course | null> => {
    try {
        const courseRef = doc(db, "courses", courseId);
        const courseSnap = await getDoc(courseRef);
        if (!courseSnap.exists()) return null;
        const courseData = { id: courseSnap.id, ...courseSnap.data() } as Course;
        const lessonsCollection = collection(db, "courses", courseId, "lessons");
        const lessonSnapshot = await getDocs(lessonsCollection);
        const lessons = lessonSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson & { id: string }));
        return { ...courseData, lessons };
    } catch (error) {
        console.error("Erro ao buscar curso com aulas: ", error);
        throw new Error("Não foi possível carregar os dados do curso.");
    }
};