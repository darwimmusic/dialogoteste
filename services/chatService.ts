import {
  getFirestore,
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { auth } from './firebase';

const db = getFirestore();

// --- Tipos de Dados ---
export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

// --- Funções do Serviço ---

/**
 * Gera um ID de chat consistente para dois usuários, ordenando os UIDs.
 * Isso garante que ambos os usuários acessem o mesmo documento de chat.
 * @param uid1 UID do primeiro usuário.
 * @param uid2 UID do segundo usuário.
 * @returns O ID combinado e ordenado (ex: "uid_abc_uid_xyz").
 */
const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

/**
 * Envia uma mensagem para um amigo.
 * @param friendUid O UID do amigo para quem a mensagem será enviada.
 * @param messageText O conteúdo da mensagem.
 */
export const sendMessage = async (friendUid: string, messageText: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || !messageText.trim()) return;

  const chatId = getChatId(currentUser.uid, friendUid);
  const messagesRef = collection(db, `chats/${chatId}/messages`);

  await addDoc(messagesRef, {
    senderId: currentUser.uid,
    text: messageText,
    timestamp: serverTimestamp(),
  });
};

/**
 * Ouve por novas mensagens em um chat em tempo real.
 * @param friendUid O UID do amigo.
 * @param callback Função a ser chamada com a lista de mensagens atualizada.
 * @returns Uma função para cancelar a escuta (unsubscribe).
 */
export const onMessagesUpdate = (friendUid: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const chatId = getChatId(currentUser.uid, friendUid);
  const messagesRef = collection(db, `chats/${chatId}/messages`);
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
    callback(messages);
  });
};

// Funções para 'messageRequests' podem ser adicionadas aqui seguindo um padrão
// similar ao de 'friendRequests' no friendService.ts. Por exemplo:
// - sendInitialMessageRequest(receiverUid, message)
// - onMessageRequestsUpdate(callback)
// - acceptMessageRequest(requestId)
// - declineMessageRequest(requestId)
