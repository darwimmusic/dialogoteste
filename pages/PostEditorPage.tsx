import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, getPostsByAuthor } from '../services/forumService';
import { useAuth } from '../hooks/useAuth';
import { grantAchievement } from '../services/achievementService';
import { LoadingSpinner } from '../components/icons/LoadingSpinner';
import { TiptapEditor } from '../components/TiptapEditor'; // Importa o novo editor

export const PostEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSavePost = async () => {
    if (!user) {
      setError("Usuário não autenticado.");
      return;
    }
    // O Tiptap pode retornar <p></p> para conteúdo vazio, então verificamos o texto
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    if (!title.trim() || !tempDiv.textContent?.trim()) {
      setError("Título e conteúdo são obrigatórios.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Verifica se é o primeiro post do usuário
      const userPosts = await getPostsByAuthor(user.uid);
      const isFirstPost = userPosts.length === 0;

      await createPost({
        authorId: user.uid,
        title,
        content,
      });

      // Concede a conquista se for o primeiro post
      if (isFirstPost) {
        await grantAchievement(user.uid, 'first_forum_post');
      }

      navigate(`/forum`); // Redireciona de volta para o fórum
    } catch (err) {
      setError("Não foi possível salvar o post.");
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl text-white">
      <h1 className="text-3xl font-bold mb-6">Criar Novo Post</h1>
      
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Título do seu post..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-700 rounded py-2 px-3 text-white text-xl"
        />
        <TiptapEditor
          content={content}
          onChange={(newContent) => setContent(newContent)}
        />
      </div>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      <div className="mt-6 flex justify-end gap-4">
        <button
          onClick={() => navigate(`/forum`)}
          className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleSavePost}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? <LoadingSpinner /> : 'Publicar Post'}
        </button>
      </div>
    </div>
  );
};
