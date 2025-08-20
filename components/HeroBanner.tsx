import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedCourses } from '../services/courseService';
import type { Course } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';

export const HeroBanner: React.FC = () => {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await getFeaturedCourses();
        setFeaturedCourses(courses);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (featuredCourses.length > 1) {
      const timer = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredCourses.length);
      }, 5000); // Muda a cada 5 segundos
      return () => clearTimeout(timer);
    }
  }, [currentIndex, featuredCourses.length]);

  if (isLoading) {
    return (
      <div className="w-full h-[75vh] bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (featuredCourses.length === 0) {
    return null; // Não renderiza nada se não houver cursos em destaque
  }

  return (
    <div className="relative w-full h-[75vh] overflow-hidden">
      {featuredCourses.map((course, index) => {
        let position = 'translate-x-full'; // For slides to the right
        if (index === currentIndex) {
          position = 'translate-x-0'; // Active slide
        } else if (
          index === currentIndex - 1 ||
          (currentIndex === 0 && index === featuredCourses.length - 1)
        ) {
          position = '-translate-x-full'; // For slides to the left
        }

        return (
          <div
            key={course.id}
            className={`absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out ${position}`}
          >
            <img
              src={course.coverImageUrl}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
        );
      })}
      
      <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-16 lg:p-24 text-white max-w-3xl pb-16">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg">
          {featuredCourses[currentIndex].title}
        </h1>
        <p className="text-lg md:text-xl mb-6 drop-shadow-md line-clamp-3">
          {featuredCourses[currentIndex].description}
        </p>
        <Link
          to={`/course/${featuredCourses[currentIndex].id}`}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 self-start"
        >
          Ver Curso
        </Link>
      </div>
    </div>
  );
};
