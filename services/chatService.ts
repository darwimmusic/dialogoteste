import { getDatabase, ref, push, onValue, serverTimestamp, query, orderByChild, get } from 'firebase/database';
import { auth } from './firebase';
import { ChatMessage } from '../types';

const db = getDatabase();
const friendsServiceUrl = 'https://friends-service-389818864410.us-central1.run.app';

const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

const initiateChat = async (friendUid: string): Promise<void> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Usuário não autenticado.");

  const response = await fetch(`${friendsServiceUrl}/initiate-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ friendUid })
  });

  if (!response.ok) {
    const errorData = await response.json();
    // Status 200 (já existe) e 201 (criado) são considerados sucesso aqui.
    if (response.status !== 200 && response.status !== 201) {
       throw new Error(errorData.error || "Falha ao iniciar o chat.");
    }
  }
};

// Adiciona uma função de espera simples
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const sendMessage = async (friendUid: string, messageText: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !messageText.trim()) return;

  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}`);
  const messagesRef = ref(db, `messages/${chatId}`);
  
  const messagePayload = {
    authorId: currentUser.uid,
    text: messageText,
    timestamp: serverTimestamp(),
  };

  try {
    // Primeira tentativa de envio
    const chatSnapshot = await get(chatRef);
    if (!chatSnapshot.exists()) {
      await initiateChat(friendUid);
      // Uma pequena espera para permitir que a criação do chat se propague
      await delay(1000); 
    }
    await push(messagesRef, messagePayload);
  } catch (error) {
    console.warn("Primeira tentativa de envio falhou. Tentando novamente após uma pausa.", error);
    // Se a primeira tentativa falhar (provavelmente por permissão),
    // esperamos um pouco mais e tentamos novamente.
    await delay(2000); // Espera adicional para garantir a propagação das regras
    try {
      await push(messagesRef, messagePayload);
    } catch (finalError) {
      console.error("Erro final ao enviar mensagem após nova tentativa:", finalError);
      throw finalError; // Lança o erro final se a segunda tentativa também falhar
    }
  }
};

export const onMessagesUpdate = (friendUid: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const chatId = getChatId(currentUser.uid, friendUid);
  const messagesRef = ref(db, `messages/${chatId}`);
  const messagesQuery = query(messagesRef, orderByChild('timestamp'));

  return onValue(messagesQuery, (snapshot) => {
    const messagesData = snapshot.val();
    if (messagesData) {
      const messages = Object.entries(messagesData).map(([id, data]) => ({
        id,
        ...(data as Omit<ChatMessage, 'id'>),
      }));
      callback(messages);
    } else {
      callback([]);
    }
  });
};
