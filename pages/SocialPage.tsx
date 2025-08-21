import React, { useState, useEffect } from 'react';
import { onFriendsUpdate, onFriendRequestsUpdate, findUserByDisplayName, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../services/friendService';
import { Friend, FriendRequest, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import ChatWindow from '../components/ChatWindow';

const SocialPage: React.FC = () => {
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Coluna da Esquerda: Lista de Amigos e Ações */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <FriendsSidebar onStartChat={setActiveChatFriend} />
      </div>

      {/* Coluna da Direita: Janela de Chat */}
      <div className="w-2/3 flex flex-col">
        {activeChatFriend ? (
          <ChatWindow key={activeChatFriend.uid} friend={activeChatFriend} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">Selecione um amigo para começar a conversar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Componentes da Barra Lateral ---

const FriendsSidebar: React.FC<{ onStartChat: (friend: Friend) => void }> = ({ onStartChat }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');

  return (
    <>
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Social</h1>
        <nav className="mt-4 flex space-x-4">
          <button onClick={() => setActiveTab('friends')} className={`pb-2 border-b-2 ${activeTab === 'friends' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'}`}>Amigos</button>
          <button onClick={() => setActiveTab('requests')} className={`pb-2 border-b-2 ${activeTab === 'requests' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'}`}>Pedidos</button>
          <button onClick={() => setActiveTab('add')} className={`pb-2 border-b-2 ${activeTab === 'add' ? 'border-purple-500 text-white' : 'border-transparent text-gray-400'}`}>Adicionar</button>
        </nav>
      </div>
      <div className="flex-grow overflow-y-auto">
        {activeTab === 'friends' && <FriendList onStartChat={onStartChat} />}
        {activeTab === 'requests' && <FriendRequests />}
        {activeTab === 'add' && <AddFriend />}
      </div>
    </>
  );
};

const FriendList: React.FC<{ onStartChat: (friend: Friend) => void }> = ({ onStartChat }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      const unsubscribe = onFriendsUpdate(setFriends);
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <div className="p-4">
      {friends.length > 0 ? (
        <ul className="space-y-2">
          {friends.map((friend, index) => (
            <li key={friend.uid || `friend-${index}`} onClick={() => onStartChat(friend)} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-700 cursor-pointer">
              <img src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} className="w-10 h-10 rounded-full" />
              <span className="font-medium">{friend.displayName}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center mt-4">Você ainda não tem amigos.</p>
      )}
    </div>
  );
};

const FriendRequests: React.FC = () => {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const unsubscribe = onFriendRequestsUpdate(setRequests);
      return () => unsubscribe();
    }
  }, [user]);

  const handleAccept = async (request: FriendRequest) => {
    await acceptFriendRequest(request);
  };

  const handleDecline = async (senderId: string) => {
    await declineFriendRequest(senderId);
  };

  return (
    <div className="p-4">
      {requests.length > 0 ? (
        <ul className="space-y-3">
          {requests.map((req, index) => (
            <li key={req.senderId || `request-${index}`} className="flex items-center justify-between p-2 rounded-md bg-gray-800">
              <div className="flex items-center gap-3">
                <img src={req.photoURL || '/default-avatar.png'} alt={req.displayName} className="w-10 h-10 rounded-full" />
                <span className="font-medium">{req.displayName}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAccept(req)} className="bg-green-600 p-2 rounded-md">Aceitar</button>
                <button onClick={() => handleDecline(req.senderId)} className="bg-gray-600 p-2 rounded-md">Recusar</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center mt-4">Nenhum pedido de amizade.</p>
      )}
    </div>
  );
};

const AddFriend: React.FC = () => {
  const [displayName, setDisplayName] = useState('');
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not_found'>(null);
  const { user } = useAuth();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim() === user?.displayName) return;
    const result = await findUserByDisplayName(displayName.trim());
    setSearchResult(result || 'not_found');
  };

  const handleAddFriend = async (receiverUid: string) => {
    try {
      await sendFriendRequest(receiverUid);
      alert("Pedido enviado!");
      setSearchResult(null);
      setDisplayName('');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nome de usuário"
          className="w-full bg-gray-700 p-2 rounded-md"
        />
        <button type="submit" className="bg-purple-600 p-2 rounded-md">Buscar</button>
      </form>

      {searchResult === 'not_found' && <p>Usuário não encontrado.</p>}
      {searchResult && typeof searchResult === 'object' && (
        <div className="flex items-center justify-between p-2 rounded-md bg-gray-800">
          <div className="flex items-center gap-3">
            <img src={searchResult.photoURL || '/default-avatar.png'} alt={searchResult.displayName} className="w-10 h-10 rounded-full" />
            <span className="font-medium">{searchResult.displayName}</span>
          </div>
          <button onClick={() => handleAddFriend(searchResult.uid)} className="bg-blue-600 p-2 rounded-md">Adicionar</button>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
