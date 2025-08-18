import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostById } from '../services/forumService';
import type { ForumPost } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { CommentSection } from '../components/CommentSection'; // Importa a nova seção

export const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<(ForumPost & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setError("ID do post não encontrado.");
      setIsLoading(false);
      return;
    }

    const fetchPostData = async () => {
      try {
        const postData = await getPostById(postId);
        setPost(postData);
      } catch (err) {
        setError("Não foi possível carregar o post.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostData();
  }, [postId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-400">{error}</div>;
  }

  if (!post) {
    return <div className="text-center p-8 text-white">Post não encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl text-white">
      <div className="mb-6">
        <Link to="/forum" className="text-blue-400 hover:underline">&larr; Voltar para o Fórum</Link>
        <h1 className="text-4xl font-bold text-white mt-2">{post.title}</h1>
        {/* Adicionar informações do autor e data aqui */}
      </div>

      <div 
        className="prose prose-invert prose-lg max-w-none bg-gray-800/50 p-6 rounded-lg"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <CommentSection postId={post.id} />
    </div>
  );
};
