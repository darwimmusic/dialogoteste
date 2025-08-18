// src/pages/DashboardPage.tsx - Versão Final e Corrigida

import React, { useState, useEffect, useMemo } from 'react';
import { CourseCarousel } from '../components/CourseCarousel';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { HeroBanner } from '../components/HeroBanner';
import { SearchBar } from '../components/SearchBar';
// CORREÇÃO AQUI: Importa a nova função de busca hierárquica
import { getFullContentHierarchy } from '../services/courseService';
import type { Theme } from '../types';

export const DashboardPage: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('');

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

  const filteredThemes = useMemo(() => {
    if (!searchTerm && !selectedTheme) {
      return themes;
    }

    return themes
      .map((theme) => {
        if (selectedTheme && theme.id !== selectedTheme) {
          return null;
        }

        const filteredCourses = theme.courses.filter((course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredCourses.length === 0) {
          return null;
        }

        return { ...theme, courses: filteredCourses };
      })
      .filter((theme): theme is Theme => theme !== null);
  }, [themes, searchTerm, selectedTheme]);

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
    <div>
      <HeroBanner />
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedTheme={selectedTheme}
          setSelectedTheme={setSelectedTheme}
          themes={themes}
        />
        <div className="space-y-12 mt-12">
          {filteredThemes.map((theme) => (
            <CourseCarousel key={theme.id} theme={theme} />
          ))}
        </div>
      </div>
    </div>
  );
};
