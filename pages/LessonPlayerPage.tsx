// src/pages/LessonPlayerPage.tsx - Versão Final Inteligente com Playlist

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseWithLessons, updateLessonSummary } from '../services/courseService';
import { completeLesson, awardBadgeIfCourseCompleted } from '../services/userService'; // Funções de conclusão
import { useAuth } from '../hooks/useAuth'; // Hook de autenticação
import { generateLessonSummary } from '../services/geminiService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { VideoPlayer } from '../components/VideoPlayer';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { AiTutorChat } from '../components/AiTutorChat';
import { LessonAttachments } from '../components/LessonAttachments';
import { NotificationPopup } from '../components/NotificationPopup'; // Importa o novo componente
import { getUserProfile } from '../services/userService'; // Precisa para verificar aulas concluídas
import type { Course, Lesson } from '../types';

export const LessonPlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [lessonSummary, setLessonSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null); // Para o pop-up
  const { user } = useAuth(); // Pega o usuário logado

  useEffect(() => {
    if (!courseId) return;
    const fetchCourseData = async () => {
      try {
        const courseData = await getCourseWithLessons(courseId);
        setCourse(courseData);
        if (courseData?.lessons?.[0]) {
          handleLessonClick(courseData.lessons[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  const handleLessonClick = async (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsSummaryLoading(true);
    setLessonSummary('');

    // Lógica de Cache:
    // 1. Se o resumo já existir na aula, use-o.
    if (lesson.summary) {
      setLessonSummary(lesson.summary);
      setIsSummaryLoading(false);
      return;
    }

    // 2. Se não existir, gere um novo, exiba e salve no banco de dados.
    try {
      if (!user) {
        throw new Error("Usuário não autenticado para gerar resumo.");
      }
      const token = await user.getIdToken();
      const newSummary = await generateLessonSummary(lesson.transcript, token);
      setLessonSummary(newSummary);
      // Salva o novo resumo no Firestore em segundo plano.
      if (courseId && lesson.id) {
        await updateLessonSummary(courseId, lesson.id, newSummary);
      }
    } catch (error) {
      console.error("Falha ao gerar resumo, exibindo transcrição original.", error);
      setLessonSummary(lesson.transcript); // Fallback para a transcrição original
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!user || !currentLesson || !courseId) return;

    const xpGained = await completeLesson(user.uid, currentLesson.id);

    if (xpGained) {
      // Verifica se o curso foi concluído para dar a badge
      const userProfile = await getUserProfile(user.uid);
      const courseLessons = course?.lessons.map(l => l.id) || [];
      // A lógica de `completeLesson` já atualizou o perfil, então buscamos de novo
      const updatedProfile = await getUserProfile(user.uid);
      const completedLessons = updatedProfile?.completedLessons || [];
      const allLessonsCompleted = courseLessons.every(lessonId => completedLessons.includes(lessonId));

      if (allLessonsCompleted) {
        await awardBadgeIfCourseCompleted(user.uid, courseId);
        setCompletionStatus(`Curso Concluído! Badge "${course?.badge?.name}" desbloqueada!`);
      } else {
        setCompletionStatus("+20 XP!");
      }
    } 
    // Não mostramos mensagem se a aula já foi concluída para não poluir a tela
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  if (!course) return <div className="text-center p-8">Curso não encontrado.</div>;
  if (!currentLesson) return <div className="text-center p-8">Este curso não possui aulas.</div>;

  return (
    <div className="container mx-auto p-4 max-w-screen-2xl">
      {/* Notificação Pop-up */}
      {completionStatus && (
        <NotificationPopup 
          message={completionStatus} 
          onClose={() => setCompletionStatus(null)}
          duration={2000}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Coluna Principal: Player e Conteúdo da Aula */}
        <div className="lg:col-span-3 flex flex-col gap-6">
           <h1 className="text-3xl font-bold text-white">{course.title}</h1>
           <h2 className="text-xl font-semibold text-gray-300 -mt-4">{currentLesson.title}</h2>
           <VideoPlayer src={currentLesson.videoUrl} onEnded={handleCompleteLesson} />
           <AiTutorChat transcript={currentLesson.transcript} />
        </div>
        
        {/* Coluna Lateral: Playlist, Conteúdo e Resumo */}
        <div className="lg:col-span-1 space-y-6">
            {/* Playlist */}
            <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Aulas do Curso</h3>
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {course.lessons?.map((lesson, index) => (
                        <li key={lesson.id}>
                            <button
                                onClick={() => handleLessonClick(lesson)}
                                className={`w-full text-left p-3 rounded-md transition-colors ${currentLesson.id === lesson.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                <span className="font-medium">Aula {index + 1}: {lesson.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Conteúdo da Aula (Anexos) */}
            {currentLesson.attachments && currentLesson.attachments.length > 0 && (
              <LessonAttachments attachments={currentLesson.attachments} />
            )}

            {/* Resumo da Aula */}
            {isSummaryLoading ? (
              <div className="bg-gray-800/50 p-4 rounded-lg flex justify-center items-center h-48">
                <LoadingSpinner />
              </div>
            ) : (
              <TranscriptViewer
                summary={lessonSummary}
                rawTranscript={currentLesson.transcript}
                lessonTitle={currentLesson.title}
              />
            )}
        </div>
      </div>
    </div>
  );
};
