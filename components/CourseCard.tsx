// src/components/CourseCard.tsx - Navegação Final

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Course } from '../types';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Navega para a página do curso, que é o nosso novo player inteligente
    navigate(`/course/${course.id}`);
  };

  return (
    <div className="flex-shrink-0 w-72 md:w-80 group cursor-pointer" onClick={handleCardClick}>
      <div className="aspect-[16/9] rounded-lg overflow-hidden mb-3 transition-all duration-300 group-hover:scale-105">
        <img src={course.coverImageUrl} alt={`Capa do curso ${course.title}`} className="w-full h-full object-cover" />
      </div>
      <div>
        <h3 className="font-semibold text-white truncate group-hover:text-blue-400">{course.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2">{course.description}</p>
      </div>
    </div>
  );
};