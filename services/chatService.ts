import { getDatabase, ref, push, onValue, serverTimestamp, query, orderByChild, get, set } from 'firebase/database';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ChatMessage } from '../types';

const db = getDatabase();

// Função auxiliar para garantir que o usuário esteja autenticado
const getAuthenticatedUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe(); // Garante que o listener seja removido após o primeiro disparo
      if (user) {
        resolve(user);
      } else {
        reject(new Error("Usuário não autenticado."));
      }
    }, reject);
  });
};
const friendsServiceUrl = 'https://friends-service-389818864410.us-central1.run.app';

const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

const initiateChat = async (friendUid: string): Promise<string> => {
  const currentUser = await getAuthenticatedUser();
  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}`);

  // Cria o chat no Realtime Database com participants já definidos
  await set(chatRef, {
    participants: {
      [currentUser.uid]: true,
      [friendUid]: true
    }
  });

  // Também chama o backend do Cloud Run para consistência, se necessário
  const token = await currentUser.getIdToken();
  await fetch(`${friendsServiceUrl}/initiate-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ friendUid })
  });
  return chatId;
};

// Garante que uma sessão de chat exista antes de prosseguir (abordagem "Write-Only")
export const ensureChatSession = async (friendUid: string): Promise<string> => {
  const currentUser = await getAuthenticatedUser();
  const chatId = getChatId(currentUser.uid, friendUid);
  const chatRef = ref(db, `chats/${chatId}/participants`);

  // Usa 'set' para criar ou confirmar a existência dos participantes.
  // Esta operação é permitida pelas regras de escrita e é idempotente.
  await set(chatRef, {
    [currentUser.uid]: true,
    [friendUid]: true
  });

  return chatId;
};


export const sendMessage = async (friendUid: string, messageText: string): Promise<void> => {
  if (!messageText.trim()) return;
  
  // A sessão é garantida primeiro. Isso cria/confirma os participantes.
  const chatId = await ensureChatSession(friendUid);
  const currentUser = await getAuthenticatedUser();
  const messagesRef = ref(db, `messages/${chatId}`);
  
  const messagePayload = {
    authorId: currentUser.uid,
    text: messageText,
    timestamp: serverTimestamp(),
  };

  // Agora a escrita da mensagem é permitida porque as regras de 'messages'
  // podem verificar a existência dos participantes que acabamos de garantir.
  await push(messagesRef, messagePayload);
};

export const onMessagesUpdate = (friendUid: string, callback: (messages: ChatMessage[]) => void): (() => void) => {
  let unsubscribe = () => {};

  const setupListener = async () => {
    try {
      // Garante que os nós de participantes existam ANTES de tentar ler as mensagens.
      // Isso satisfaz a regra de segurança de leitura de 'messages'.
      const chatId = await ensureChatSession(friendUid);
      const messagesRef = ref(db, `messages/${chatId}`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));

      unsubscribe = onValue(messagesQuery, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnap) => {
          const data = childSnap.val();
          messages.push({
            id: childSnap.key!,
            authorId: data.authorId,
            text: data.text,
            timestamp: data.timestamp,
          });
        });
        messages.sort((a, b) => a.timestamp - b.timestamp);
        callback(messages);
      }, (error) => {
        console.error(`[ChatService] Firebase read failed for chatId ${chatId}:`, error);
        callback([]);
      });
    } catch (error) {
      console.error("[ChatService] Error setting up message listener:", error);
      callback([]);
    }
  };

  setupListener();

  // Retorna uma função que cancelará a inscrição
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};
