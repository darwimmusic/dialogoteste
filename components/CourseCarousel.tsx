// src/components/CourseCarousel.tsx - Versão Final e Robusta

import React from 'react';
import type { Theme } from '../types';
import { CourseCard } from './CourseCard';

// A interface agora espera o objeto 'theme' completo
interface CourseCarouselProps {
  theme: Theme;
}

export const CourseCarousel: React.FC<CourseCarouselProps> = ({ theme }) => {
  // Verificação de segurança (Guard Clause):
  // Se não houver cursos neste tema ou a propriedade 'courses' não existir,
  // este componente simplesmente não renderiza nada. Isso evita o erro.
  if (!theme.courses || theme.courses.length === 0) {
    return null; 
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-4 px-4 sm:px-6 lg:px-8">{theme.title}</h2>
      <div className="relative">
        <div className="flex space-x-4 lg:space-x-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50 px-4 sm:px-6 lg:px-8">
          {/* O map agora é seguro. A prop 'onSelectLesson' foi removida. */}
          {theme.courses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course}
            />
          ))}
        </div>
      </div>
    </div>
  );
};