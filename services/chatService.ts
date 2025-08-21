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

export const sendMessage = async (friendUid: string, messageText: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !messageText.trim()) return;

  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}`);
  const chatSnapshot = await get(chatRef);

  // Se o chat não existir, delega a criação para o backend.
  if (!chatSnapshot.exists()) {
    await initiateChat(friendUid);
  }

  // Agora que o backend garantiu a existência do chat, envia a mensagem.
  const messagesRef = ref(db, `messages/${chatId}`);
  await push(messagesRef, {
    authorId: currentUser.uid,
    text: messageText,
    timestamp: serverTimestamp(),
  });
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
