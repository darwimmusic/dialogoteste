import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPostById, deletePost } from '../services/forumService';
import { getUserProfile } from '../services/userService';
import type { ForumPost, UserProfile } from '../types';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { CommentSection } from '../components/CommentSection';
import { useAuth } from '../hooks/useAuth';

interface PostWithAuthor extends ForumPost {
  author: UserProfile | null;
}

export const PostPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!postId) {
      setError("ID do post não encontrado.");
      setIsLoading(false);
      return;
    }

    const fetchPostData = async () => {
      try {
        const postData = await getPostById(postId);
        if (postData) {
          const author = await getUserProfile(postData.authorId);
          setPost({ ...postData, author });
        } else {
          setError("Post não encontrado.");
        }
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

  const handleDelete = async () => {
    if (!postId) return;
    if (window.confirm('Tem certeza que deseja excluir este post? Todos os comentários serão perdidos.')) {
      try {
        await deletePost(postId);
        navigate('/forum');
      } catch (err) {
        setError('Falha ao excluir o post.');
      }
    }
  };

  const canDelete = user && (user.uid === post.authorId || isAdmin);

  return (
    <div className="container mx-auto p-8 max-w-4xl text-white">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <Link to="/forum" className="text-blue-400 hover:underline">&larr; Voltar para o Fórum</Link>
            <h1 className="text-4xl font-bold text-white mt-2">{post.title}</h1>
            <p className="text-sm text-gray-400 mt-1">
              por {post.author?.displayName || 'Usuário Desconhecido'} em {new Date(post.createdAt?.toDate()).toLocaleDateString()}
            </p>
          </div>
          {canDelete && (
            <button onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">
              Excluir Post
            </button>
          )}
        </div>
      </div>

      <div 
        className="prose prose-invert prose-lg max-w-none bg-gray-800/50 p-6 rounded-lg"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <CommentSection postId={post.id} />
    </div>
  );
};
