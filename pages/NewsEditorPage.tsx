import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { TiptapEditor } from '../components/TiptapEditor';
import { createNewsArticle, getNewsArticleById, updateNewsArticle, uploadNewsMedia } from '../services/newsService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

export const NewsEditorPage: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAdmin) {
      setError('Você não tem permissão para realizar esta ação.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setError('Título e conteúdo são obrigatórios.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalCoverImageUrl = coverImageUrl;

      if (isEditing && newsId) {
        // Se estiver editando e uma nova imagem for selecionada
        if (coverImageFile) {
          finalCoverImageUrl = await uploadNewsMedia(newsId, coverImageFile);
        }
        await updateNewsArticle(newsId, { title, content, coverImageUrl: finalCoverImageUrl, authorId: user.uid });
        navigate(`/news/${newsId}`);
      } else {
        // Se estiver criando um novo artigo
        if (!coverImageFile) {
          setError('Uma imagem de capa é obrigatória.');
          setIsLoading(false);
          return;
        }
        // Primeiro, cria o artigo para obter um ID
        const newArticleId = await createNewsArticle({ title, content, coverImageUrl: '', authorId: user.uid });
        // Depois, faz o upload da imagem com o ID obtido
        finalCoverImageUrl = await uploadNewsMedia(newArticleId, coverImageFile);
        // Finalmente, atualiza o artigo com a URL da imagem
        await updateNewsArticle(newArticleId, { coverImageUrl: finalCoverImageUrl });
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
          <label htmlFor="coverImage" className="block text-lg font-medium text-gray-300 mb-2">Imagem de Capa</label>
          <input
            id="coverImage"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
          />
          {coverImageUrl && !coverImageFile && (
            <img src={coverImageUrl} alt="Capa atual" className="mt-4 w-full max-w-xs rounded-md" />
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
