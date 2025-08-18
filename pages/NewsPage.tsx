
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNewsArticles } from '../services/newsService';
import { useAuth } from '../hooks/useAuth';
import type { NewsArticle } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<(NewsArticle & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'createdAt' | 'likes'>('createdAt');
  const { isAdmin } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    getNewsArticles(sortBy)
      .then(setArticles)
      .catch(error => console.error("Failed to fetch news:", error))
      .finally(() => setIsLoading(false));
  }, [sortBy]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Notícias</h1>
        {isAdmin && (
          <Link to="/news/create">
            <button className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md">
              Criar Nova Notícia
            </button>
          </Link>
        )}
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <span className="text-gray-400">Ordenar por:</span>
        <button
          onClick={() => setSortBy('createdAt')}
          className={`px-4 py-2 rounded-md ${sortBy === 'createdAt' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Mais Recentes
        </button>
        <button
          onClick={() => setSortBy('likes')}
          className={`px-4 py-2 rounded-md ${sortBy === 'likes' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Mais Populares
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <Link to={`/news/${article.id}`} key={article.id} className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-500/50 transition-shadow duration-300">
              <img src={article.coverImageUrl} alt={article.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h2 className="text-xl font-bold text-white mb-2">{article.title}</h2>
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{new Date(article.createdAt?.toDate()).toLocaleDateString()}</span>
                  <span>❤️ {article.likes}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
