import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';
import type { NewsArticle } from '../types';

const storage = getStorage();
const newsCollection = collection(db, 'news');

/**
 * Faz o upload de uma imagem ou vídeo para uma notícia específica.
 * @param newsId O ID da notícia.
 * @param file O arquivo de mídia a ser carregado.
 * @returns A URL de download da mídia.
 */
export const uploadNewsMedia = async (newsId: string, file: File): Promise<string> => {
  if (!file) throw new Error('Nenhum arquivo fornecido.');

  const filePath = `admin_content/NEWS/${newsId}/${file.name}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error('Error uploading news media:', error);
    throw new Error('Falha ao carregar a mídia da notícia.');
  }
};

/**
 * Cria um novo artigo de notícia.
 * @param articleData Os dados do artigo a ser criado.
 * @returns O ID do novo artigo criado.
 */
export const createNewsArticle = async (articleData: Omit<NewsArticle, 'id' | 'createdAt' | 'likes' | 'likedBy'>): Promise<string> => {
  try {
    const docRef = await addDoc(newsCollection, {
      ...articleData,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating news article:', error);
    throw new Error('Não foi possível criar a notícia.');
  }
};

/**
 * Busca todos os artigos de notícia.
 * @param sortBy Critério de ordenação: 'createdAt' (mais recentes) ou 'likes' (mais populares).
 * @returns Uma lista de artigos de notícia.
 */
export const getNewsArticles = async (sortBy: 'createdAt' | 'likes' = 'createdAt'): Promise<(NewsArticle & { id: string })[]> => {
  try {
    const q = query(newsCollection, orderBy(sortBy, 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsArticle & { id: string }));
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw new Error('Não foi possível carregar as notícias.');
  }
};

/**
 * Busca um artigo de notícia específico pelo seu ID.
 * @param id O ID do artigo.
 * @returns O artigo de notícia ou null se não encontrado.
 */
export const getNewsArticleById = async (id: string): Promise<(NewsArticle & { id: string }) | null> => {
  try {
    const docRef = doc(db, 'news', id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as NewsArticle & { id: string };
    }
    return null;
  } catch (error) {
    console.error('Error fetching news article by ID:', error);
    throw new Error('Não foi possível carregar a notícia.');
  }
};

/**
 * Atualiza um artigo de notícia existente.
 * @param id O ID do artigo a ser atualizado.
 * @param data Os novos dados para o artigo.
 */
export const updateNewsArticle = async (id: string, data: Partial<Omit<NewsArticle, 'id'>>): Promise<void> => {
  try {
    const docRef = doc(db, 'news', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating news article:', error);
    throw new Error('Não foi possível atualizar a notícia.');
  }
};

/**
 * Deleta um artigo de notícia.
 * @param id O ID do artigo a ser deletado.
 */
export const deleteNewsArticle = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'news', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting news article:', error);
    throw new Error('Não foi possível deletar a notícia.');
  }
};

/**
 * Adiciona ou remove um like de um artigo de notícia.
 * @param newsId O ID da notícia.
 * @param userId O ID do usuário que está curtindo/descurtindo.
 */
export const toggleLike = async (newsId: string, userId: string): Promise<void> => {
  const docRef = doc(db, 'news', newsId);
  const article = await getDoc(docRef);

  if (!article.exists()) {
    throw new Error('Notícia não encontrada.');
  }

  const likedBy = article.data().likedBy || [];
  const isLiked = likedBy.includes(userId);

  try {
    if (isLiked) {
      // Remove o like
      await updateDoc(docRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId),
      });
    } else {
      // Adiciona o like
      await updateDoc(docRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId),
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw new Error('Não foi possível registrar a curtida.');
  }
};
