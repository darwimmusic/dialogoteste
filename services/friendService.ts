import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { auth } from './firebase';
import type { UserProfile } from '../types';

const db = getFirestore();

// --- Tipos de Dados ---
export interface FriendRequest {
  senderId: string;
  displayName: string;
  photoURL?: string;
  timestamp: Timestamp;
}

export interface Friend {
  uid: string;
  displayName: string;
  photoURL?: string;
}

// --- Funções do Serviço ---

/**
 * Procura por um usuário pelo seu nome de exibição (displayName).
 * Retorna o perfil do usuário se encontrado, senão null.
 * @param displayName O nome de exibição a ser pesquisado.
 */
export const findUserByDisplayName = async (displayName: string): Promise<UserProfile | null> => {
  if (!displayName) return null;
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('displayName', '==', displayName));
  
  try {
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Retorna o primeiro usuário encontrado
      const userDoc = querySnapshot.docs[0];
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário por displayName:", error);
    return null;
  }
};

/**
 * Envia um pedido de amizade para um usuário.
 * @param receiverUid O UID do usuário que receberá o pedido.
 */
export const sendFriendRequest = async (receiverUid: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid === receiverUid) return;

  const requestRef = doc(db, `users/${receiverUid}/friendRequests/${currentUser.uid}`);
  
  const requestData = {
    senderId: currentUser.uid,
    displayName: currentUser.displayName || 'Usuário Anônimo',
    photoURL: currentUser.photoURL || '',
    timestamp: Timestamp.now(),
  };

  await setDoc(requestRef, requestData);
};

/**
 * Ouve por pedidos de amizade em tempo real.
 * @param callback Uma função que será chamada com a lista de pedidos.
 * @returns Uma função para cancelar a escuta (unsubscribe).
 */
export const onFriendRequestsUpdate = (callback: (requests: FriendRequest[]) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const requestsRef = collection(db, `users/${currentUser.uid}/friendRequests`);
  const q = query(requestsRef);

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => doc.data() as FriendRequest);
    callback(requests);
  });
};

const friendsServiceUrl = 'https://friends-service-389818864410.us-central1.run.app';

export const acceptFriendRequest = async (sender: FriendRequest): Promise<void> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Usuário não autenticado.");

  const response = await fetch(`${friendsServiceUrl}/accept-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ senderId: sender.senderId, senderData: sender })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Falha ao aceitar pedido de amizade.");
  }
};

/**
 * Recusa um pedido de amizade.
 * @param senderId O UID do remetente do pedido.
 */
export const declineFriendRequest = async (senderId: string): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const requestRef = doc(db, `users/${currentUser.uid}/friendRequests/${senderId}`);
  await deleteDoc(requestRef);
};

/**
 * Ouve por atualizações na lista de amigos em tempo real.
 */
export const onFriendsUpdate = (callback: (friends: Friend[]) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const friendsRef = collection(db, `users/${currentUser.uid}/friends`);
  const q = query(friendsRef);

  return onSnapshot(q, (snapshot) => {
    const friends = snapshot.docs.map(doc => {
      const data = doc.data() as Omit<Friend, 'uid'>;
      return {
        uid: doc.id,       // <-- importante!
        displayName: data.displayName,
        photoURL: data.photoURL,
      };
    });
    callback(friends);
  });
};

export const removeFriend = async (friendUid: string): Promise<void> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Usuário não autenticado.");

  const response = await fetch(`${friendsServiceUrl}/remove-friend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ friendUid })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Falha ao remover amigo.");
  }
};
