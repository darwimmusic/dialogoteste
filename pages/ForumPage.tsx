import React, { useState, useEffect } from 'react';
import { getPosts } from '../services/forumService';
import type { ForumPost } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { Link } from 'react-router-dom';

export const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<(ForumPost & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const fetchedPosts = await getPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        setError("Não foi possível carregar os posts.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-white">Fórum</h1>
        <Link to="/forum/create-post">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
            Criar Novo Post
          </button>
        </Link>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
              <Link to={`/forum/post/${post.id}`} className="block">
                <h3 className="text-xl font-semibold text-blue-400">{post.title}</h3>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                  <span>{post.commentCount || 0} comentários</span>
                  <span>{post.upvotes || 0} upvotes</span>
                  {/* Adicionar informações do autor e data aqui no futuro */}
                </div>
              </Link>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-gray-800/50 rounded-lg">
            <p className="text-gray-400">Nenhum post foi criado ainda. Seja o primeiro!</p>
          </div>
        )}
      </div>
    </div>
  );
};
