import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { addComment, getCommentsForPost, deleteComment, getCommentsByUser, toggleCommentLike } from '../services/forumService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { grantAchievement } from '../services/achievementService';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAdmin } = useAuth();

  const handleAddReply = async () => {
    if (!user || !replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    // Otimista: Adiciona o comentário à UI antes de esperar a resposta do servidor
    const newReply: CommentWithAuthor = {
      id: Date.now().toString(), // ID temporário
      postId: postId,
      authorId: user.uid,
      content: replyContent,
      parentId: comment.id,
      createdAt: new Date(),
      upvotes: 0,
      likedBy: [],
      author: await getUserProfile(user.uid),
      replies: [],
    };
    
    // Atualiza o estado local (a ser implementado no componente pai)
    // onReplySuccess(newReply); // Passa o novo comentário para o pai

    await addComment(postId, {
      authorId: user.uid,
      content: replyContent,
      parentId: comment.id,
      likedBy: [],
    });

    setReplyContent('');
    setShowReply(false);
    onReplySuccess(); // Recarrega para obter o ID real e confirmar
    setIsSubmitting(false);
  };

  const handleLike = async () => {
    if (!user) return;

    // Otimista: Atualiza a UI imediatamente
    const alreadyLiked = comment.likedBy?.includes(user.uid);
    const newUpvotes = (comment.upvotes || 0) + (alreadyLiked ? -1 : 1);
    const newLikedBy = alreadyLiked
      ? comment.likedBy?.filter(uid => uid !== user.uid)
      : [...(comment.likedBy || []), user.uid];

    // Atualiza o estado local (a ser implementado no componente pai)
    // onLikeToggle(comment.id, newUpvotes, newLikedBy);

    // Conquista: Primeira curtida em comentário
    const userProfile = await getUserProfile(user.uid);
    if (userProfile && !userProfile.hasLikedComment) {
      await updateUserProfile(user.uid, { hasLikedComment: true });
      await grantAchievement(user.uid, 'first_comment_like');
    }

    await toggleCommentLike(postId, comment.id, user.uid);
    onReplySuccess(); // Sincroniza com o servidor
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
            {user && user.uid === comment.authorId && (
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
          <div className="flex items-center space-x-4 mt-2">
            <button onClick={() => setShowReply(!showReply)} className="text-xs text-blue-400">Responder</button>
            <button onClick={handleLike} className={`text-xs flex items-center space-x-1 ${comment.likedBy?.includes(user?.uid || '') ? 'text-red-500' : 'text-gray-400'}`}>
              <span>❤️</span>
              <span>{comment.upvotes || 0}</span>
            </button>
          </div>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    if (!user || !rootComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Otimista: Adiciona o comentário à UI antes de esperar a resposta do servidor
    const newComment: CommentWithAuthor = {
      id: Date.now().toString(), // ID temporário
      postId: postId,
      authorId: user.uid,
      content: rootComment,
      parentId: null,
      createdAt: new Date(),
      upvotes: 0,
      likedBy: [],
      author: await getUserProfile(user.uid),
      replies: [],
    };
    setComments(prev => [...prev, newComment]);

    await addComment(postId, {
      authorId: user.uid,
      content: rootComment,
      parentId: null,
      likedBy: [],
    });

    setRootComment('');
    fetchComments(); // Sincroniza para obter o ID real
    setIsSubmitting(false);
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
        <button 
          onClick={handleAddRootComment} 
          className="bg-green-600 text-white px-4 py-2 rounded mt-2 disabled:bg-gray-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner /> : 'Comentar'}
        </button>
      </div>
    </div>
  );
};
