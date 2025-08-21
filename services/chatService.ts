import { getDatabase, ref, push, onValue, serverTimestamp, query, orderByChild, get, update } from 'firebase/database';
import { auth } from './firebase';
import { ChatMessage } from '../types';

const db = getDatabase();

const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

export const sendMessage = async (friendUid: string, messageText: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !messageText.trim()) return;

  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}`);
  const chatSnapshot = await get(chatRef);

  // Se o chat não existir, crie-o primeiro.
  if (!chatSnapshot.exists()) {
    const chatData = {
      participants: {
        [currentUser.uid]: true,
        [friendUid]: true,
      },
      createdAt: serverTimestamp(),
    };
    // Cria o chat e os índices de usuário em uma operação atômica
    const updates: { [key: string]: any } = {};
    updates[`chats/${chatId}`] = chatData;
    updates[`userChats/${currentUser.uid}/${chatId}`] = true;
    updates[`userChats/${friendUid}/${chatId}`] = true;
    await update(ref(db), updates);
  }

  // Agora que o chat garantidamente existe, envie a mensagem.
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
