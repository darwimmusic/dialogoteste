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
import { onAuthStateChanged, User } from 'firebase/auth';
import type { UserProfile } from '../types';

const db = getFirestore();

// Função auxiliar para garantir que o usuário esteja autenticado
const getAuthenticatedUser = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error("Usuário não autenticado."));
      }
    }, reject);
  });
};

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
  const currentUser = await getAuthenticatedUser();
  if (currentUser.uid === receiverUid) return;

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
  let unsubscribe = () => {};

  getAuthenticatedUser().then(currentUser => {
    const requestsRef = collection(db, `users/${currentUser.uid}/friendRequests`);
    const q = query(requestsRef);
    unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => doc.data() as FriendRequest);
      callback(requests);
    });
  }).catch(error => {
    console.error("Falha ao obter usuário para friend requests update:", error);
    callback([]);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

const friendsServiceUrl = 'https://friends-service-389818864410.us-central1.run.app';

export const acceptFriendRequest = async (sender: FriendRequest): Promise<void> => {
  const currentUser = await getAuthenticatedUser();
  const token = await currentUser.getIdToken();

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
  const currentUser = await getAuthenticatedUser();
  const requestRef = doc(db, `users/${currentUser.uid}/friendRequests/${senderId}`);
  await deleteDoc(requestRef);
};

/**
 * Ouve por atualizações na lista de amigos em tempo real, buscando os perfis completos.
 */
export const onFriendsUpdate = (callback: (friends: Friend[]) => void): (() => void) => {
  let unsubscribe = () => {};

  getAuthenticatedUser().then(currentUser => {
    const friendsRef = collection(db, `users/${currentUser.uid}/friends`);
    const q = query(friendsRef);
    
    unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }

      const friendPromises = snapshot.docs.map(friendDoc => {
        const friendId = friendDoc.id;
        const userProfileRef = doc(db, 'users', friendId);
        return getDoc(userProfileRef);
      });

      const friendDocs = await Promise.all(friendPromises);

      const friends: Friend[] = friendDocs
        .filter(docSnap => docSnap.exists())
        .map(docSnap => {
          const data = docSnap.data() as UserProfile;
          return {
            uid: docSnap.id,
            displayName: data.displayName,
            photoURL: data.photoURL,
          };
        });
      
      callback(friends);
    });
  }).catch(error => {
    console.error("Falha ao obter usuário para friends update:", error);
    callback([]);
  });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

export const removeFriend = async (friendUid: string): Promise<void> => {
  const currentUser = await getAuthenticatedUser();
  const token = await currentUser.getIdToken();

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
