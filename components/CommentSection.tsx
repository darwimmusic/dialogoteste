import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addComment, getCommentsForPost, deleteComment } from '../services/forumService';
import { getUserProfile } from '../services/userService';
import type { ForumComment, UserProfile } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { TiptapEditor } from './TiptapEditor'; // Usaremos o editor para comentários também

interface CommentWithAuthor extends ForumComment {
  author: UserProfile | null;
  replies: CommentWithAuthor[];
}

interface CommentProps {
  comment: CommentWithAuthor;
  postId: string;
  onReplySuccess: () => void;
}

const Comment: React.FC<CommentProps> = ({ comment, postId, onReplySuccess }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { user, isAdmin } = useAuth();

  const handleAddReply = async () => {
    if (!user || !replyContent.trim()) return;
    
    await addComment(postId, {
      authorId: user.uid,
      content: replyContent,
      parentId: comment.id
    });
    setReplyContent('');
    setShowReply(false);
    onReplySuccess(); // Notifica o componente pai para recarregar os comentários
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este comentário?')) {
      try {
        await deleteComment(postId, comment.id);
        onReplySuccess(); // Recarrega os comentários para refletir a exclusão
      } catch (error) {
        console.error("Falha ao excluir comentário:", error);
        // Opcional: mostrar um erro para o usuário
      }
    }
  };

  return (
    <div className="ml-4 pl-4 border-l-2 border-gray-700">
      <div className="flex items-start space-x-3">
        <img src={comment.author?.photoURL || 'https://via.placeholder.com/150'} alt="avatar" className="w-8 h-8 rounded-full" />
        <div className="flex-1">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sm text-white">{comment.author?.displayName}</p>
            {user && (user.uid === comment.authorId || isAdmin) && (
              <button 
                onClick={handleDelete} 
                className="text-xs text-red-400 hover:text-red-300"
                title="Excluir comentário"
              >
                Excluir
              </button>
            )}
          </div>
          <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: comment.content }} />
          <button onClick={() => setShowReply(!showReply)} className="text-xs text-blue-400 mt-1">Responder</button>
        </div>
      </div>
      {showReply && (
        <div className="mt-2 ml-12">
          <TiptapEditor content={replyContent} onChange={setReplyContent} />
          <button onClick={handleAddReply} className="bg-blue-600 text-white px-2 py-1 text-sm rounded mt-2">Enviar Resposta</button>
        </div>
      )}
      {comment.replies.map(reply => (
        <Comment key={reply.id} comment={reply} postId={postId} onReplySuccess={onReplySuccess} />
      ))}
    </div>
  );
};


export const CommentSection: React.FC<{ postId: string }> = ({ postId }) => {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [rootComment, setRootComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchComments = async () => {
    setIsLoading(true);
    const fetchedComments = await getCommentsForPost(postId);
    const commentsWithAuthors: CommentWithAuthor[] = await Promise.all(
      fetchedComments.map(async c => {
        const author = await getUserProfile(c.authorId);
        return { ...c, author, replies: [] };
      })
    );

    // Estrutura os comentários em uma árvore
    const commentMap: { [key: string]: CommentWithAuthor } = {};
    commentsWithAuthors.forEach(c => commentMap[c.id] = c);
    const nestedComments: CommentWithAuthor[] = [];
    commentsWithAuthors.forEach(c => {
      if (c.parentId) {
        commentMap[c.parentId]?.replies.push(c);
      } else {
        nestedComments.push(c);
      }
    });

    setComments(nestedComments);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleAddRootComment = async () => {
    if (!user || !rootComment.trim()) return;
    await addComment(postId, {
      authorId: user.uid,
      content: rootComment,
      parentId: null
    });
    setRootComment('');
    fetchComments(); // Recarrega tudo
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4">Comentários</h2>
      <div className="space-y-4">
        {comments.map(comment => (
          <Comment key={comment.id} comment={comment} postId={postId} onReplySuccess={fetchComments} />
        ))}
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Adicionar um Comentário</h3>
        <TiptapEditor content={rootComment} onChange={setRootComment} />
        <button onClick={handleAddRootComment} className="bg-green-600 text-white px-4 py-2 rounded mt-2">Comentar</button>
      </div>
    </div>
  );
};
