import React, { useEffect } from 'react';
import type { Theme } from '../types';
import { useAuth } from '../hooks/useAuth';
import { grantAchievement } from '../services/achievementService';
import { getUserProfile, updateUserProfile } from '../services/userService';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTheme: string;
  setSelectedTheme: (theme: string) => void;
  themes: Theme[];
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedTheme,
  setSelectedTheme,
  themes,
}) => {
  const { user } = useAuth();

  useEffect(() => {
    const handleSearchAchievement = async () => {
      if (user && searchTerm.trim() !== '') {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile && !userProfile.hasSearchedCourse) {
          await updateUserProfile(user.uid, { hasSearchedCourse: true });
          await grantAchievement(user.uid, 'first_course_search');
        }
      }
    };

    const debounceTimeout = setTimeout(() => {
      handleSearchAchievement();
    }, 1000); // Concede a conquista após 1 segundo de digitação

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, user]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg my-4">
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Pesquisar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os temas</option>
          {themes.map((theme) => (
            <option key={theme.id} value={theme.id}>
              {theme.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
