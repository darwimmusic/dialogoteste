import React, { useState, useEffect } from 'react';
import { onFriendsUpdate, onFriendRequestsUpdate, findUserByDisplayName, sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../services/friendService';
import { Friend, FriendRequest, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';
import ChatWindow from '../components/ChatWindow';
import eventEmitter from '../utils/eventEmitter';

type Tab = 'friends' | 'requests' | 'add';

const SocialPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);

  useEffect(() => {
    const handleStartChat = (friend: Friend) => {
      setActiveTab('friends');
      setActiveChatFriend(friend);
    };

    eventEmitter.on('start-chat', handleStartChat);

    // Cleanup listener when component unmounts
    // return () => eventEmitter.off('start-chat', handleStartChat); // Assuming an 'off' method exists
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Social</h1>
      
      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setActiveTab('friends')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'friends' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
            Amigos
          </button>
          <button onClick={() => setActiveTab('requests')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'requests' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
            Pedidos de Amizade
          </button>
          <button onClick={() => setActiveTab('add')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'add' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
            Adicionar Amigo
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'friends' && <FriendList onStartChat={setActiveChatFriend} />}
        {activeTab === 'requests' && <FriendRequests />}
        {activeTab === 'add' && <AddFriend />}
      </div>

      {activeChatFriend && (
        <ChatWindow 
          friend={activeChatFriend} 
          onClose={() => setActiveChatFriend(null)} 
        />
      )}
    </div>
  );
};

// --- Componentes das Abas ---

interface FriendListProps {
  onStartChat: (friend: Friend) => void;
}

const FriendList: React.FC<FriendListProps> = ({ onStartChat }) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      const unsubscribe = onFriendsUpdate(setFriends);
      return () => unsubscribe();
    }
  }, [user]);

  const handleRemoveFriend = async (friendUid: string) => {
    if (window.confirm("Tem certeza que deseja remover este amigo?")) {
      try {
        await removeFriend(friendUid);
        alert("Amigo removido com sucesso.");
      } catch (error) {
        console.error("Erro ao remover amigo:", error);
        alert("Não foi possível remover o amigo.");
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sua Lista de Amigos</h2>
      {friends.length > 0 ? (
        <ul className="space-y-3">
          {friends.map(friend => (
            <li key={friend.uid} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} className="w-12 h-12 rounded-full" />
                <span className="font-medium">{friend.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onStartChat(friend)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Conversar
                </button>
                <button onClick={() => handleRemoveFriend(friend.uid)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Você ainda não tem amigos. Adicione alguns!</p>
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
    try {
      await acceptFriendRequest(request);
      alert("Pedido de amizade aceito!");
    } catch (error) {
      console.error("Erro ao aceitar pedido:", error);
      alert("Não foi possível aceitar o pedido.");
    }
  };

  const handleDecline = async (senderId: string) => {
    try {
      await declineFriendRequest(senderId);
      alert("Pedido de amizade recusado.");
    } catch (error) {
      console.error("Erro ao recusar pedido:", error);
      alert("Não foi possível recusar o pedido.");
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pedidos Recebidos</h2>
      {requests.length > 0 ? (
        <ul className="space-y-3">
          {requests.map(req => (
            <li key={req.senderId} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={req.photoURL || '/default-avatar.png'} alt={req.displayName} className="w-12 h-12 rounded-full" />
                <span className="font-medium">{req.displayName}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAccept(req)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                  Aceitar
                </button>
                <button onClick={() => handleDecline(req.senderId)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                  Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum pedido de amizade pendente.</p>
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
    if (!displayName.trim() || displayName.trim() === user?.displayName) {
        setSearchResult(null);
        return;
    };
    const result = await findUserByDisplayName(displayName.trim());
    setSearchResult(result || 'not_found');
  };

  const handleAddFriend = async (receiverUid: string) => {
    try {
      await sendFriendRequest(receiverUid);
      alert("Pedido de amizade enviado com sucesso!");
      setSearchResult(null);
      setDisplayName('');
    } catch (error: any) {
      console.error("Erro ao enviar pedido:", error);
      alert(`Não foi possível enviar o pedido: ${error.message}`);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Adicionar Amigo por Nome de Usuário</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Digite o nome de usuário"
          className="flex-grow bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Buscar
        </button>
      </form>

      {searchResult === 'not_found' && <p>Usuário não encontrado.</p>}
      {searchResult && typeof searchResult === 'object' && (
        <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={searchResult.photoURL || '/default-avatar.png'} alt={searchResult.displayName} className="w-12 h-12 rounded-full" />
            <span className="font-medium">{searchResult.displayName}</span>
          </div>
          <button onClick={() => handleAddFriend(searchResult.uid)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Enviar Pedido
          </button>
        </div>
      )}
    </div>
  );
};

export default SocialPage;
