import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getNewsArticleById, toggleLike, deleteNewsArticle } from '../services/newsService';
import { useAuth } from '../hooks/useAuth';
import type { NewsArticle } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

export const NewsDetailPage: React.FC = () => {
  const { newsId } = useParams<{ newsId: string }>();
  const [article, setArticle] = useState<(NewsArticle & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchArticle = () => {
    if (!newsId) {
      setError('ID da notícia não encontrado.');
      setIsLoading(false);
      return;
    }
    getNewsArticleById(newsId)
      .then(setArticle)
      .catch(() => setError('Não foi possível carregar a notícia.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchArticle();
  }, [newsId]);

  const handleLike = async () => {
    if (!user || !newsId) return;
    try {
      await toggleLike(newsId, user.uid);
      // Atualiza o estado local para refletir a mudança imediatamente
      setArticle(prev => {
        if (!prev) return null;
        const isLiked = prev.likedBy.includes(user.uid);
        return {
          ...prev,
          likes: isLiked ? prev.likes - 1 : prev.likes + 1,
          likedBy: isLiked ? prev.likedBy.filter(uid => uid !== user.uid) : [...prev.likedBy, user.uid],
        };
      });
    } catch (err) {
      console.error(err);
      // Opcional: mostrar um erro para o usuário
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !newsId) return;
    if (window.confirm('Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.')) {
      try {
        await deleteNewsArticle(newsId);
        navigate('/news');
      } catch (err) {
        setError('Falha ao excluir a notícia.');
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  }

  if (error || !article) {
    return <div className="container mx-auto p-4 text-center text-red-500">{error || 'Artigo não encontrado.'}</div>;
  }

  const isLikedByUser = user ? article.likedBy.includes(user.uid) : false;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <img src={article.coverImageUrl} alt={article.title} className="w-full h-64 md:h-96 object-cover rounded-lg mb-6" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-4xl font-bold text-white">{article.title}</h1>
          <p className="text-gray-400 mt-2">
            Publicado em {new Date(article.createdAt?.toDate()).toLocaleDateString()}
          </p>
        </div>
        {isAdmin && (
          <div className="flex space-x-2">
            <Link to={`/news/edit/${article.id}`}>
              <button className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-md">
                Editar
              </button>
            </Link>
            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md">
              Excluir
            </button>
          </div>
        )}
      </div>

      <div className="prose prose-invert lg:prose-xl max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: article.content }} />

      <div className="mt-8 pt-4 border-t border-gray-700 flex items-center space-x-4">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`px-4 py-2 rounded-full flex items-center space-x-2 transition-colors ${
            isLikedByUser ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span>❤️</span>
          <span>{article.likes}</span>
        </button>
        <span className="text-gray-400">{isLikedByUser ? 'Você curtiu isto.' : 'Seja o primeiro a curtir!'}</span>
      </div>
    </div>
  );
};
