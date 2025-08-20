import React, { useState, useEffect } from 'react';
import { getPosts, getPostsByAuthor } from '../services/forumService';
import type { ForumPost } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<(ForumPost & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [filter, setFilter] = useState<'all' | 'my-posts'>(searchParams.get('filter') === 'my-posts' ? 'my-posts' : 'all');

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let fetchedPosts;
        if (filter === 'my-posts' && user) {
          fetchedPosts = await getPostsByAuthor(user.uid);
        } else {
          fetchedPosts = await getPosts();
        }
        setPosts(fetchedPosts);
      } catch (err) {
        setError("Não foi possível carregar os posts.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [filter, user]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-white">Fórum</h1>
        <Link to="/forum/create-post">
          <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded">
            Criar Novo Post
          </button>
        </Link>
      </div>

      <div className="flex items-center space-x-4 mb-6 border-b border-gray-700 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Todos os Posts
        </button>
        <button
          onClick={() => setFilter('my-posts')}
          className={`px-4 py-2 rounded-md ${filter === 'my-posts' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Meus Posts
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map(post => (
            <div key={post.id} className="bg-gray-800/50 p-4 rounded-lg hover:bg-gray-700/50 transition-colors">
              <Link to={`/forum/post/${post.id}`} className="block">
                <h3 className="text-xl font-semibold text-purple-400">{post.title}</h3>
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
