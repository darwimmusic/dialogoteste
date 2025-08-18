import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TiptapEditor } from '../components/TiptapEditor';
import { createNewsArticle, getNewsArticleById, updateNewsArticle } from '../services/newsService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

export const NewsEditorPage: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(newsId);

  useEffect(() => {
    if (isEditing && newsId) {
      setIsLoading(true);
      getNewsArticleById(newsId)
        .then(article => {
          if (article) {
            setTitle(article.title);
            setContent(article.content);
            setCoverImageUrl(article.coverImageUrl);
          } else {
            setError('Artigo não encontrado.');
          }
        })
        .catch(() => setError('Falha ao carregar o artigo.'))
        .finally(() => setIsLoading(false));
    }
  }, [newsId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      setError('Você não tem permissão para realizar esta ação.');
      return;
    }
    if (!title.trim() || !content.trim() || !coverImageUrl.trim()) {
      setError('Título, conteúdo e URL da imagem de capa são obrigatórios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const articleData = {
        title,
        content,
        coverImageUrl,
        authorId: user.uid,
      };

      if (isEditing && newsId) {
        await updateNewsArticle(newsId, articleData);
        navigate(`/news/${newsId}`);
      } else {
        const newArticleId = await createNewsArticle(articleData);
        navigate(`/news/${newArticleId}`);
      }
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao salvar o artigo. Tente novamente.');
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="container mx-auto p-4">Acesso negado.</div>;
  }

  if (isLoading && isEditing) {
    return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-white">{isEditing ? 'Editar Notícia' : 'Criar Nova Notícia'}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">Título</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Título da notícia"
          />
        </div>
        <div>
          <label htmlFor="coverImageUrl" className="block text-lg font-medium text-gray-300 mb-2">URL da Imagem de Capa</label>
          <input
            id="coverImageUrl"
            type="text"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-blue-500"
            placeholder="https://exemplo.com/imagem.jpg"
          />
          {coverImageUrl && (
            <img src={coverImageUrl} alt="Pré-visualização da capa" className="mt-4 w-full max-w-xs rounded-md" />
          )}
        </div>
        <div>
          <label className="block text-lg font-medium text-gray-300 mb-2">Conteúdo</label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-md disabled:bg-gray-500 flex items-center"
          >
            {isLoading && <LoadingSpinner className="mr-2" />}
            {isEditing ? 'Salvar Alterações' : 'Publicar Notícia'}
          </button>
        </div>
      </form>
    </div>
  );
};
