// src/pages/LessonPlayerPage.tsx - Versão Final Inteligente com Playlist

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseWithLessons } from '../services/courseService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { VideoPlayer } from '../components/VideoPlayer';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { AiTutorChat } from '../components/AiTutorChat';
import type { Course, Lesson } from '../types';

export const LessonPlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const fetchCourseData = async () => {
      try {
        const courseData = await getCourseWithLessons(courseId);
        setCourse(courseData);
        // Define a primeira aula como a aula atual por padrão
        if (courseData && courseData.lessons && courseData.lessons.length > 0) {
          setCurrentLesson(courseData.lessons[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!course) return <div className="text-center p-8">Curso não encontrado.</div>;
  if (!currentLesson) return <div className="text-center p-8">Este curso não possui aulas.</div>;

  return (
    <div className="container mx-auto p-4 max-w-screen-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Coluna Principal: Player e Conteúdo da Aula */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <h1 className="text-3xl font-bold text-white">{course.title}</h1>
           <h2 className="text-xl font-semibold text-gray-300 -mt-4">{currentLesson.title}</h2>
           <VideoPlayer src={currentLesson.videoUrl} />
           <AiTutorChat transcript={currentLesson.transcript} />
        </div>
        
        {/* Coluna Lateral: Playlist e Transcrição */}
        <div className="lg:col-span-1 space-y-6">
            {/* Playlist */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Aulas do Curso</h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {course.lessons?.map((lesson, index) => (
                        <li key={lesson.id}>
                            <button 
                                onClick={() => setCurrentLesson(lesson)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${currentLesson.id === lesson.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                <span className="font-medium">Aula {index + 1}: {lesson.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            {/* Transcrição */}
            <TranscriptViewer transcript={currentLesson.transcript} />
        </div>
      </div>
    </div>
  );
};