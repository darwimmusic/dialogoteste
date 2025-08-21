import { getDatabase, ref, push, onValue, serverTimestamp, query, orderByChild, get, set } from 'firebase/database';
import { auth } from './firebase';
import { ChatMessage } from '../types';

const db = getDatabase();
const friendsServiceUrl = 'https://friends-service-389818864410.us-central1.run.app';

const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

const initiateChat = async (friendUid: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("Usuário não autenticado.");

  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}`);

  // Cria o chat no Realtime Database com participants já definidos
  await set(chatRef, {
    participants: {
      [currentUser.uid]: true,
      [friendUid]: true
    }
  });

  // Também chama o backend do Cloud Run, se necessário
  const token = await currentUser.getIdToken();
  await fetch(`${friendsServiceUrl}/initiate-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ friendUid })
  });
};

// Função de delay
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
    const chatSnapshot = await get(chatRef);
    if (!chatSnapshot.exists() || !chatSnapshot.child('participants').exists()) {
      await initiateChat(friendUid);
      await delay(500); // pequena espera para propagação
    }
    await push(messagesRef, messagePayload);
  } catch (error) {
    console.warn("Primeira tentativa de envio falhou. Tentando novamente após uma pausa.", error);
    await delay(1000);
    try {
      await push(messagesRef, messagePayload);
    } catch (finalError) {
      console.error("Erro final ao enviar mensagem após nova tentativa:", finalError);
      throw finalError;
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
