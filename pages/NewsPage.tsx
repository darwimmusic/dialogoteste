
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNewsArticles } from '../services/newsService';
import { useAuth } from '../hooks/useAuth';
import type { NewsArticle } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';

export const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<(NewsArticle & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    // Ordena sempre por data de criação, conforme solicitado
    getNewsArticles('createdAt')
      .then(setArticles)
      .catch(error => console.error("Failed to fetch news:", error))
      .finally(() => setIsLoading(false));
  }, []);

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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {articles.map(article => (
            <Link to={`/news/${article.id}`} key={article.id} className="flex bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300 w-full">
              <img src={article.coverImageUrl} alt={article.title} className="w-1/3 h-auto object-cover hidden md:block" />
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{article.title}</h2>
                  {/* Opcional: Adicionar um resumo do conteúdo aqui se desejar */}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
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
