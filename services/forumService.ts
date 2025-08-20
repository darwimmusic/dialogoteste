import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  orderBy,
  increment
} from "firebase/firestore";
import { db } from './firebase';
import type { ForumPost, ForumComment } from '../types';
import { grantAchievement } from './achievementService';

// --- Funções de Posts ---

/**
 * Cria um novo post no fórum.
 * @param postData Os dados do post a ser criado.
 */
export const createPost = async (postData: Omit<ForumPost, 'id' | 'createdAt' | 'upvotes' | 'commentCount'>): Promise<void> => {
  try {
    await addDoc(collection(db, "posts"), {
      ...postData,
      upvotes: 0,
      commentCount: 0,
      createdAt: serverTimestamp()
    });

    // Concede a conquista de primeiro post
    if (postData.authorId) {
      grantAchievement(postData.authorId, 'first_forum_post');
    }
  } catch (error) {
    console.error("Erro ao criar post: ", error);
    throw new Error("Não foi possível criar o post.");
  }
};

/**
 * Busca todos os posts do fórum, ordenados pelo mais recente.
 * @returns Uma lista de posts.
 */
export const getPosts = async (): Promise<(ForumPost & { id: string })[]> => {
  try {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, orderBy("createdAt", "desc"));
    const postSnapshot = await getDocs(q);
    return postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost & { id: string }));
  } catch (error) {
    console.error("Erro ao buscar posts: ", error);
    throw new Error("Não foi possível carregar os posts do fórum.");
  }
};

/**
 * Busca um post específico pelo seu ID.
 * @param postId O ID do post.
 * @returns O post ou null se não encontrado.
 */
export const getPostById = async (postId: string): Promise<(ForumPost & { id: string }) | null> => {
  try {
    const postRef = doc(db, "posts", postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      return { id: postSnap.id, ...postSnap.data() } as ForumPost & { id: string };
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar post por ID: ", error);
    throw new Error("Não foi possível carregar o post.");
  }
};

/**
 * Busca todos os posts de um autor específico.
 * @param authorId O ID do autor.
 * @returns Uma lista de posts do autor.
 */
export const getPostsByAuthor = async (authorId: string): Promise<(ForumPost & { id: string })[]> => {
  try {
    const postsCollection = collection(db, "posts");
    const q = query(postsCollection, where("authorId", "==", authorId), orderBy("createdAt", "desc"));
    const postSnapshot = await getDocs(q);
    return postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost & { id: string }));
  } catch (error) {
    console.error("Erro ao buscar posts por autor: ", error);
    // Este erro pode exigir a criação de um índice no Firestore.
    // O Firebase fornecerá um link para criá-lo no console de erro do navegador.
    throw new Error("Não foi possível carregar os posts do usuário.");
  }
};

// --- Funções de Comentários ---

/**
 * Adiciona um novo comentário a um post.
 * @param postId O ID do post a ser comentado.
 * @param commentData Os dados do comentário, que agora devem incluir o authorId.
 */
export const addComment = async (postId: string, commentData: Omit<ForumComment, 'id' | 'createdAt' | 'upvotes' | 'postId'>): Promise<void> => {
  // A `commentData` agora deve conter `authorId` vindo do componente.
  try {
    const commentsCollection = collection(db, `posts/${postId}/comments`);
    await addDoc(commentsCollection, {
      ...commentData,
      postId: postId,
      upvotes: 0,
      createdAt: serverTimestamp()
    });
    // Atualiza a contagem de comentários no post
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { commentCount: increment(1) });

    // Concede a conquista de primeiro comentário
    if (commentData.authorId) {
      grantAchievement(commentData.authorId, 'first_forum_comment');
    }
  } catch (error) {
    console.error("Erro ao adicionar comentário: ", error);
    throw new Error("Não foi possível adicionar o comentário.");
  }
};

/**
 * Busca todos os comentários de um post específico.
 * @param postId O ID do post.
 * @returns Uma lista de comentários.
 */
export const getCommentsForPost = async (postId: string): Promise<(ForumComment & { id: string })[]> => {
  try {
    const commentsCollection = collection(db, `posts/${postId}/comments`);
    const q = query(commentsCollection, orderBy("createdAt", "asc")); // Ordena do mais antigo para o mais novo
    const commentSnapshot = await getDocs(q);
    return commentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumComment & { id: string }));
  } catch (error) {
    console.error("Erro ao buscar comentários: ", error);
    throw new Error("Não foi possível carregar os comentários.");
  }
};

/**
 * Busca todos os comentários de um usuário específico em todos os posts.
 * @param userId O ID do usuário.
 * @returns Uma lista de comentários do usuário.
 */
export const getCommentsByUser = async (userId: string): Promise<(ForumComment & { id: string })[]> => {
  try {
    const posts = await getPosts();
    let userComments: (ForumComment & { id: string })[] = [];

    for (const post of posts) {
      const commentsCollection = collection(db, `posts/${post.id}/comments`);
      const q = query(commentsCollection, where("authorId", "==", userId));
      const commentSnapshot = await getDocs(q);
      const comments = commentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumComment & { id: string }));
      userComments = [...userComments, ...comments];
    }

    return userComments;
  } catch (error) {
    console.error("Erro ao buscar comentários por usuário: ", error);
    throw new Error("Não foi possível carregar os comentários do usuário.");
  }
};

/**
 * Alterna o like de um usuário em um comentário.
 * @param postId O ID do post.
 * @param commentId O ID do comentário.
 * @param userId O ID do usuário que está curtindo.
 */
export const toggleCommentLike = async (postId: string, commentId: string, userId: string): Promise<void> => {
  const commentRef = doc(db, `posts/${postId}/comments`, commentId);
  try {
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) {
      throw new Error("Comentário não encontrado.");
    }
    const commentData = commentSnap.data() as ForumComment;
    const likedBy = commentData.likedBy || [];
    
    if (likedBy.includes(userId)) {
      // Remove o like
      await updateDoc(commentRef, {
        likedBy: likedBy.filter(uid => uid !== userId),
        upvotes: increment(-1)
      });
    } else {
      // Adiciona o like
      await updateDoc(commentRef, {
        likedBy: [...likedBy, userId],
        upvotes: increment(1)
      });
    }
  } catch (error) {
    console.error("Erro ao alternar like do comentário: ", error);
    throw new Error("Não foi possível atualizar o like do comentário.");
  }
};

/**
 * Deleta um comentário específico.
 * @param postId O ID do post pai do comentário.
 * @param commentId O ID do comentário a ser deletado.
 */
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    const commentRef = doc(db, `posts/${postId}/comments`, commentId);
    await deleteDoc(commentRef);
    // Decrementa a contagem de comentários no post
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { commentCount: increment(-1) });
  } catch (error) {
    console.error("Erro ao deletar comentário: ", error);
    throw new Error("Não foi possível deletar o comentário.");
  }
};

/**
 * Deleta um post e todos os seus comentários.
 * @param postId O ID do post a ser deletado.
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const commentsCollection = collection(db, `posts/${postId}/comments`);
    const commentsSnapshot = await getDocs(commentsCollection);
    
    // Deleta todos os comentários em paralelo
    const deletePromises = commentsSnapshot.docs.map(commentDoc => 
      deleteDoc(doc(db, `posts/${postId}/comments`, commentDoc.id))
    );
    await Promise.all(deletePromises);

    // Deleta o post principal
    const postRef = doc(db, "posts", postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error("Erro ao deletar o post: ", error);
    throw new Error("Não foi possível deletar o post e seus comentários.");
  }
};
