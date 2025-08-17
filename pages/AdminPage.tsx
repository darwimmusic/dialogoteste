// src/pages/AdminPage.tsx - Versão Dinâmica com Formulários Condicionais

import React, { useState, useEffect, useCallback } from 'react';
import { createTheme, createCourse, createLesson, getThemes, getCoursesForTheme } from '../services/adminService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import type { Theme, Course } from '../types';

// Para controlar qual formulário está visível
type AdminView = 'theme' | 'course' | 'lesson' | null;

export const AdminPage: React.FC = () => {
  // Estado para controlar a visão atual
  const [view, setView] = useState<AdminView>(null);
  
  // Estados de dados e seleção
  const [themes, setThemes] = useState<(Theme & { id: string })[]>([]);
  const [courses, setCourses] = useState<(Course & { id: string })[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // Estados dos formulários (agora encapsulados)
  const [formData, setFormData] = useState({ title: '', description: '', coverImageUrl: '', videoUrl: '' });
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Função para buscar temas, agora reutilizável
  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedThemes = await getThemes();
      setThemes(fetchedThemes);
      if (fetchedThemes.length > 0 && !selectedThemeId) {
        setSelectedThemeId(fetchedThemes[0].id);
      }
    } catch (err) { setError("Não foi possível carregar os temas."); }
    setIsLoading(false);
  }, [selectedThemeId]);

  // Efeito para a busca inicial de temas
  useEffect(() => {
    fetchThemes();
  }, []);

  // Efeito para buscar cursos quando um tema é selecionado
  useEffect(() => {
    if (!selectedThemeId) { setCourses([]); return; }
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const fetchedCourses = await getCoursesForTheme(selectedThemeId);
        setCourses(fetchedCourses);
        setSelectedCourseId(fetchedCourses.length > 0 ? fetchedCourses[0].id : '');
      } catch (err) { setError("Não foi possível carregar os cursos."); }
      setIsLoading(false);
    };
    fetchCourses();
  }, [selectedThemeId]);

  // Manipulador de envio genérico
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (view === 'theme') {
        await createTheme({ title: formData.title, description: formData.description });
        setSuccess(`Tema "${formData.title}" criado!`);
        await fetchThemes(); // Atualiza a lista de temas
      } else if (view === 'course') {
        await createCourse({ title: formData.title, description: formData.description, coverImageUrl: formData.coverImageUrl, themeId: selectedThemeId });
        setSuccess(`Curso "${formData.title}" criado!`);
        const updatedCourses = await getCoursesForTheme(selectedThemeId); // Atualiza a lista
        setCourses(updatedCourses);
      } else if (view === 'lesson') {
        await createLesson(selectedCourseId, { title: formData.title, videoUrl: formData.videoUrl, transcript: "Placeholder" });
        setSuccess(`Aula "${formData.title}" criada!`);
      }
      setFormData({ title: '', description: '', coverImageUrl: '', videoUrl: '' }); // Limpa o formulário
      setView(null); // Esconde o formulário
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Renderiza o formulário apropriado com base na 'view'
  const renderForm = () => {
    if (!view) return null;

    return (
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 mt-4 ring-2 ring-blue-500">
        <h3 className="text-lg font-semibold text-white">Criar Novo {view === 'theme' ? 'Tema' : view === 'course' ? 'Curso' : 'Aula'}</h3>
        
        {/* Campos do Formulário */}
        <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Título" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />
        {(view === 'theme' || view === 'course') && <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descrição" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />}
        {view === 'course' && <input name="coverImageUrl" value={formData.coverImageUrl} onChange={handleInputChange} placeholder="URL da Imagem de Capa" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />}
        {view === 'lesson' && <input name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} placeholder="URL do Vídeo" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />}
        
        <div className="flex gap-4">
          <button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">{isLoading ? <LoadingSpinner /> : 'Salvar'}</button>
          <button type="button" onClick={() => setView(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
        </div>
      </form>
    );
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-8">
      <h1 className="text-3xl font-bold text-white">Painel de Administração</h1>
      
      {/* SELETORES DE CONTEXTO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg">
        <div>
          <label htmlFor="themeSelect" className="block text-sm font-medium text-gray-300 mb-1">Contexto do Tema</label>
          <select id="themeSelect" value={selectedThemeId} onChange={(e) => setSelectedThemeId(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white">
            {themes.length === 0 && <option>Nenhum tema criado</option>}
            {themes.map(theme => <option key={theme.id} value={theme.id}>{theme.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="courseSelect" className="block text-sm font-medium text-gray-300 mb-1">Contexto do Curso</label>
          <select id="courseSelect" value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="w-full bg-gray-700 rounded-lg py-2 px-3 text-white" disabled={!selectedThemeId || courses.length === 0}>
            {courses.length === 0 && <option>Nenhum curso neste tema</option>}
            {courses.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO */}
      <div className="flex flex-wrap gap-4">
        <button onClick={() => setView('theme')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">Criar Novo Tema</button>
        <button onClick={() => setView('course')} disabled={!selectedThemeId} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Criar Novo Curso</button>
        <button onClick={() => setView('lesson')} disabled={!selectedCourseId} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Criar Nova Aula</button>
      </div>

      {error && <p className="text-red-400 text-sm p-3 bg-red-900/50 rounded-md">{error}</p>}
      {success && <p className="text-green-400 text-sm p-3 bg-green-900/50 rounded-md">{success}</p>}

      {/* ÁREA DE FORMULÁRIO DINÂMICO */}
      {renderForm()}
    </div>
  );
};