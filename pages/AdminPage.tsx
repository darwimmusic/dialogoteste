// src/pages/AdminPage.tsx - Versão Final com Gerenciamento de Aulas

import React, { useState, useEffect, useCallback } from 'react';
import { 
  createTheme, 
  createCourse, 
  createLesson, 
  getThemes, 
  getCoursesForTheme, 
  getLessonsForCourse, 
  updateLessonAttachments,
  getAllCourses,
  updateCourseFeaturedStatus,
  getTitleBadges,
  updateTitleBadge
} from '../services/adminService';
import { addOrUpdateBadgeForCourse } from '../services/courseService'; // Importa a nova função
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import type { Theme, Course, Lesson, Attachment } from '../types';

// Para controlar qual formulário está visível
type AdminView = 'theme' | 'course' | 'lesson' | 'manage_attachments' | 'manage_featured' | 'manage_badges' | 'manage_title_badges' | null;

const ALL_TITLES = [
  "Ferro", "Bronze", "Prata", "Ouro", "Platina", 
  "Esmeralda", "Diamante", "Mestre", "Grão-Mestre", "Campeão"
];

export const AdminPage: React.FC = () => {
  // Estado para controlar a visão atual
  const [view, setView] = useState<AdminView>(null);
  
  // Estados de dados e seleção
  const [themes, setThemes] = useState<(Theme & { id: string })[]>([]);
  const [courses, setCourses] = useState<(Course & { id: string })[]>([]);
  const [allCourses, setAllCourses] = useState<(Course & { id: string })[]>([]);
  const [lessons, setLessons] = useState<(Lesson & { id: string })[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { id: string }) | null>(null);

  // Estados dos formulários (agora encapsulados)
  const [formData, setFormData] = useState({ title: '', description: '', coverImageUrl: '', videoUrl: '' });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [titleBadges, setTitleBadges] = useState<Map<string, string>>(new Map());
  
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
    if (!selectedThemeId) { 
      setCourses([]);
      setLessons([]);
      return; 
    }
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const fetchedCourses = await getCoursesForTheme(selectedThemeId);
        setCourses(fetchedCourses);
        const firstCourseId = fetchedCourses.length > 0 ? fetchedCourses[0].id : '';
        setSelectedCourseId(firstCourseId);
      } catch (err) { setError("Não foi possível carregar os cursos."); }
      setIsLoading(false);
    };
    fetchCourses();
  }, [selectedThemeId]);

  // Efeito para buscar aulas quando um curso é selecionado
  useEffect(() => {
    if (!selectedCourseId) { setLessons([]); return; }
    const fetchLessons = async () => {
      setIsLoading(true);
      try {
        const fetchedLessons = await getLessonsForCourse(selectedCourseId);
        setLessons(fetchedLessons);
      } catch (err) { setError("Não foi possível carregar as aulas."); }
      setIsLoading(false);
    };
    fetchLessons();
  }, [selectedCourseId]);

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
        // Filtra anexos vazios antes de enviar
        const validAttachments = attachments.filter(att => att.name.trim() !== '' && att.url.trim() !== '');
        const selectedTheme = themes.find(t => t.id === selectedThemeId);
        await createLesson(selectedCourseId, { 
          title: formData.title, 
          themeTitle: selectedTheme?.title || 'Tema Desconhecido',
          videoUrl: formData.videoUrl, 
          transcript: "Placeholder", // A transcrição é adicionada manualmente depois
          attachments: validAttachments 
        });
        setSuccess(`Aula "${formData.title}" criada com ${validAttachments.length} anexo(s)!`);
        const updatedLessons = await getLessonsForCourse(selectedCourseId);
        setLessons(updatedLessons);
      } else if (view === 'manage_attachments' && selectedLesson) {
        const validAttachments = attachments.filter(att => att.name.trim() !== '' && att.url.trim() !== '');
        await updateLessonAttachments(selectedCourseId, selectedLesson.id, validAttachments);
        setSuccess(`Anexos da aula "${selectedLesson.title}" atualizados!`);
        const updatedLessons = await getLessonsForCourse(selectedCourseId);
        setLessons(updatedLessons);
      }
      setFormData({ title: '', description: '', coverImageUrl: '', videoUrl: '' }); // Limpa o formulário
      setAttachments([]); // Limpa os anexos
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

  // --- Funções para manipular anexos ---
  const handleAddAttachment = () => {
    setAttachments(prev => [...prev, { name: '', url: '' }]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentChange = (index: number, field: keyof Attachment, value: string) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments[index][field] = value;
      return newAttachments;
    });
  };
  // ------------------------------------

  // Renderiza o formulário apropriado com base na 'view'
  const renderForm = () => {
    if (!view) return null;

    // Formulário de Gerenciamento de Anexos
    if (view === 'manage_attachments') {
      if (!selectedLesson) return <p className="text-yellow-400">Selecione uma aula para gerenciar.</p>;
      return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 mt-4 ring-2 ring-purple-500">
          <h3 className="text-lg font-semibold text-white">Gerenciar Conteúdo da Aula: <span className="font-normal text-purple-300">{selectedLesson.title}</span></h3>
          <div className="space-y-3 pt-2">
            {attachments.map((att, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md">
                <input value={att.name} onChange={(e) => handleAttachmentChange(index, 'name', e.target.value)} placeholder="Nome do Arquivo" className="flex-1 bg-gray-600 rounded py-1 px-2 text-white text-sm" />
                <input value={att.url} onChange={(e) => handleAttachmentChange(index, 'url', e.target.value)} placeholder="URL do Arquivo" className="flex-1 bg-gray-600 rounded py-1 px-2 text-white text-sm" />
                <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 p-1">&times;</button>
              </div>
            ))}
            <button type="button" onClick={handleAddAttachment} className="text-sm text-purple-400 hover:text-purple-300">+ Adicionar Arquivo</button>
          </div>
          <div className="flex gap-4">
            <button type="submit" disabled={isLoading} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded">{isLoading ? <LoadingSpinner /> : 'Salvar Anexos'}</button>
            <button type="button" onClick={() => { setView(null); setSelectedLesson(null); setAttachments([]); }} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Fechar</button>
          </div>
        </form>
      );
    }

    // Formulários de Criação
    return (
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4 mt-4 ring-2 ring-blue-500">
        <h3 className="text-lg font-semibold text-white">Criar Novo {view === 'theme' ? 'Tema' : view === 'course' ? 'Curso' : 'Aula'}</h3>
        
        {/* Campos do Formulário */}
        <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Título" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />
        {(view === 'theme' || view === 'course') && <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Descrição" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />}
        {view === 'course' && <input name="coverImageUrl" value={formData.coverImageUrl} onChange={handleInputChange} placeholder="URL da Imagem de Capa" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />}
        
        {/* Campos específicos da aula */}
        {view === 'lesson' && (
          <>
            <input name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} placeholder="URL do Vídeo" required className="w-full bg-gray-700 rounded py-2 px-3 text-white" />
            
            {/* Seção de Anexos */}
            <div className="space-y-3 pt-2">
              <h4 className="text-md font-semibold text-gray-200">Conteúdo da Aula (Anexos)</h4>
              {attachments.map((att, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-700/50 rounded-md">
                  <input 
                    value={att.name} 
                    onChange={(e) => handleAttachmentChange(index, 'name', e.target.value)} 
                    placeholder="Nome do Arquivo" 
                    className="flex-1 bg-gray-600 rounded py-1 px-2 text-white text-sm" 
                  />
                  <input 
                    value={att.url} 
                    onChange={(e) => handleAttachmentChange(index, 'url', e.target.value)} 
                    placeholder="URL do Arquivo" 
                    className="flex-1 bg-gray-600 rounded py-1 px-2 text-white text-sm" 
                  />
                  <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-400 hover:text-red-300 p-1">&times;</button>
                </div>
              ))}
              <button type="button" onClick={handleAddAttachment} className="text-sm text-blue-400 hover:text-blue-300">+ Adicionar Arquivo</button>
            </div>
          </>
        )}
        
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
        <button onClick={() => { setView('theme'); setAttachments([]); }} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">Criar Novo Tema</button>
        <button onClick={() => { setView('course'); setAttachments([]); }} disabled={!selectedThemeId} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Criar Novo Curso</button>
        <button onClick={() => { setView('lesson'); setAttachments([]); }} disabled={!selectedCourseId} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Criar Nova Aula</button>
        <button onClick={() => { setView('manage_attachments'); setSelectedLesson(null); setAttachments([]); }} disabled={!selectedCourseId} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">Gerenciar Conteúdo</button>
        <button 
          onClick={async () => {
            setView('manage_featured');
            setIsLoading(true);
            try {
              const allCoursesData = await getAllCourses();
              setAllCourses(allCoursesData);
            } catch (err) { setError("Não foi possível carregar todos os cursos."); }
            setIsLoading(false);
          }} 
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded"
        >
          Gerenciar Destaques
        </button>
        <button 
          onClick={async () => {
            setView('manage_badges');
            setIsLoading(true);
            try {
              const allCoursesData = await getAllCourses();
              setAllCourses(allCoursesData);
            } catch (err) { setError("Não foi possível carregar todos os cursos."); }
            setIsLoading(false);
          }} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded"
        >
          Gerenciar Badges
        </button>
        <button 
          onClick={async () => {
            setView('manage_title_badges');
            setIsLoading(true);
            try {
              const fetchedBadges = await getTitleBadges();
              const badgeMap = new Map<string, string>();
              fetchedBadges.forEach(badge => {
                badgeMap.set(badge.name, badge.imageUrl);
              });
              setTitleBadges(badgeMap);
            } catch (err) { setError("Não foi possível carregar as badges de título."); }
            setIsLoading(false);
          }} 
          className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-4 rounded"
        >
          Gerenciar Badges de Título
        </button>
      </div>

      {error && <p className="text-red-400 text-sm p-3 bg-red-900/50 rounded-md">{error}</p>}
      {success && <p className="text-green-400 text-sm p-3 bg-green-900/50 rounded-md">{success}</p>}

      {/* ÁREA DE FORMULÁRIO DINÂMICO */}
      {renderForm()}

      {/* LISTA DE AULAS PARA GERENCIAMENTO */}
      {view === 'manage_attachments' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Selecione uma aula para editar:</h3>
          <ul className="space-y-2">
            {lessons.map(lesson => (
              <li key={lesson.id}>
                <button 
                  onClick={() => {
                    setSelectedLesson(lesson);
                    setAttachments(lesson.attachments || []);
                  }}
                  className={`w-full text-left p-3 rounded-md transition-colors ${selectedLesson?.id === lesson.id ? 'bg-purple-800 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >
                  {lesson.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* LISTA DE CURSOS PARA GERENCIAR DESTAQUES */}
      {view === 'manage_featured' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Cursos em Destaque</h3>
          <div className="space-y-2">
            {allCourses.map(course => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <span className="text-white">{course.title}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!course.isFeatured} 
                    onChange={async (e) => {
                      const newStatus = e.target.checked;
                      // Optimistic UI update
                      setAllCourses(prev => prev.map(c => c.id === course.id ? { ...c, isFeatured: newStatus } : c));
                      try {
                        await updateCourseFeaturedStatus(course.id, newStatus);
                      } catch (err) {
                        setError("Falha ao atualizar. Revertendo.");
                        // Revert on failure
                        setAllCourses(prev => prev.map(c => c.id === course.id ? { ...c, isFeatured: !newStatus } : c));
                      }
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTA DE CURSOS PARA GERENCIAR BADGES */}
      {view === 'manage_badges' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Badges dos Cursos</h3>
          <div className="space-y-4">
            {allCourses.map(course => (
              <form 
                key={course.id} 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const target = e.target as typeof e.target & {
                    badgeName: { value: string };
                    badgeDesc: { value: string };
                    badgeImg: { value: string };
                  };
                  const badgeData = {
                    name: target.badgeName.value,
                    description: target.badgeDesc.value,
                    imageUrl: target.badgeImg.value,
                  };
                  if (!badgeData.name || !badgeData.description || !badgeData.imageUrl) {
                    setError(`Preencha todos os campos da badge para "${course.title}".`);
                    return;
                  }
                  setIsLoading(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    await addOrUpdateBadgeForCourse(course.id, badgeData);
                    setSuccess(`Badge do curso "${course.title}" salva com sucesso!`);
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="p-4 bg-gray-700 rounded-md"
              >
                <p className="font-bold text-white">{course.title}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <input name="badgeName" defaultValue={course.badge?.name} placeholder="Nome da Badge" className="bg-gray-600 rounded py-1 px-2 text-white" />
                  <input name="badgeDesc" defaultValue={course.badge?.description} placeholder="Descrição" className="bg-gray-600 rounded py-1 px-2 text-white" />
                  <input name="badgeImg" defaultValue={course.badge?.imageUrl} placeholder="URL da Imagem" className="bg-gray-600 rounded py-1 px-2 text-white" />
                </div>
                <button type="submit" disabled={isLoading} className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded text-sm">
                  {isLoading ? <LoadingSpinner /> : 'Salvar Badge'}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* SEÇÃO PARA GERENCIAR BADGES DE TÍTULO */}
      {view === 'manage_title_badges' && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Badges de Título</h3>
          <div className="space-y-4 p-4 bg-gray-700 rounded-md">
            {ALL_TITLES.map(title => (
              <div key={title} className="flex items-center space-x-4">
                <label className="w-1/4 text-lg text-gray-300">{title}</label>
                <input
                  type="text"
                  value={titleBadges.get(title) || ''}
                  onChange={(e) => {
                    const newBadges = new Map(titleBadges);
                    newBadges.set(title, e.target.value);
                    setTitleBadges(newBadges);
                  }}
                  placeholder="URL da imagem da badge"
                  className="flex-grow bg-gray-600 rounded py-1 px-2 text-white"
                />
                <button
                  onClick={async () => {
                    const imageUrl = titleBadges.get(title);
                    if (typeof imageUrl === 'string') {
                      setIsLoading(true);
                      setError(null);
                      setSuccess(null);
                      try {
                        await updateTitleBadge(title, imageUrl);
                        setSuccess(`Badge '${title}' salva com sucesso!`);
                        setTimeout(() => setSuccess(null), 3000);
                      } catch (err) {
                        setError(`Falha ao salvar a badge '${title}'.`);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Salvar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
