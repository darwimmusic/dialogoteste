// src/pages/DashboardPage.tsx - Versão Final e Corrigida

import React, { useState, useEffect } from 'react';
import { CourseCarousel } from '../components/CourseCarousel';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
// CORREÇÃO AQUI: Importa a nova função de busca hierárquica
import { getFullContentHierarchy } from '../services/courseService'; 
import type { Theme } from '../types';

export const DashboardPage: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Chama a função correta que busca Temas, Cursos e Aulas
        const themesWithContent = await getFullContentHierarchy();
        setThemes(themesWithContent);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 p-8">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
          Mergulhe no Futuro
        </h1>
        <p className="text-lg text-gray-400">
          Explore nossos temas, participe de discussões e conecte-se com outros inovadores.
        </p>
      </div>

      <div className="space-y-12">
        {themes.map((theme) => (
          <CourseCarousel key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );
};