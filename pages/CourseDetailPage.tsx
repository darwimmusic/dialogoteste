// src/pages/CourseDetailPage.tsx - Nova Página

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseWithLessons } from '../services/courseService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import type { Course } from '../types';

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        const courseData = await getCourseWithLessons(courseId);
        setCourse(courseData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner /></div>;
  if (!course) return <div className="text-center p-8">Curso não encontrado.</div>;

  return (
    <div className="container mx-auto p-8">
      <img src={course.coverImageUrl} alt={course.title} className="w-full h-64 object-cover rounded-lg mb-4" />
      <h1 className="text-4xl font-bold text-white mb-2">{course.title}</h1>
      <p className="text-gray-400 mb-8">{course.description}</p>
      
      <div className="bg-gray-800/50 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">Aulas do Curso</h2>
        <ul className="space-y-2">
          {course.lessons?.map((lesson, index) => (
            <li key={lesson.id}>
              <Link 
                to={`/lesson/${lesson.id}`} 
                className="block p-4 bg-gray-700 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <span className="text-gray-400 mr-4">Aula {index + 1}:</span>
                <span className="text-white font-medium">{lesson.title}</span>
              </Link>
            </li>
          ))}
          {(!course.lessons || course.lessons.length === 0) && (
            <p className="text-gray-500">Nenhuma aula disponível para este curso ainda.</p>
          )}
        </ul>
      </div>
    </div>
  );
};