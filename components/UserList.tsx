import React, { useState } from 'react';
import { ref, update } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useListVals } from 'react-firebase-hooks/database';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile } from '../services/userService';
import { sendFriendRequest } from '../services/friendService';
import type { UserProfile } from '../types';
import UserActionPopup from './UserActionPopup';
import eventEmitter from '../utils/eventEmitter';
import { useNavigate } from 'react-router-dom';

interface UserListProps {
  sessionId: string;
}

interface Participant {
  displayName: string;
  uid: string;
  photoURL: string;
  handRaised?: boolean;
  micEnabled?: boolean;
}

export const UserList: React.FC<UserListProps> = ({ sessionId }) => {
  const { user, isAdmin } = useAuth();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
  const [participants, loading] = useListVals<Participant>(participantsRef);

  const handleUserSelect = async (uid: string) => {
    if (uid === user?.uid) return; // Don't open popup for self
    const profile = await getUserProfile(uid);
    if (profile) {
      setSelectedUser(profile);
    }
  };

  const handleAddFriend = async (uid: string) => {
    try {
      await sendFriendRequest(uid);
      alert('Pedido de amizade enviado!');
      setSelectedUser(null);
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleSendMessage = (uid: string) => {
    const friend = { uid, displayName: selectedUser?.displayName || '', photoURL: selectedUser?.photoURL || '' };
    eventEmitter.emit('start-chat', friend);
    setSelectedUser(null);
    navigate('/social');
  };

  const handleToggleMic = (uid: string, isEnabled: boolean) => {
    const participantRef = ref(rtdb, `liveSessions/${sessionId}/participants/${uid}`);
    update(participantRef, { micEnabled: isEnabled, handRaised: false });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white">
      {selectedUser && (
        <UserActionPopup 
          targetUser={selectedUser}
          onClose={() => setSelectedUser(null)}
          onAddFriend={handleAddFriend}
          onSendMessage={handleSendMessage}
        />
      )}
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
        Participantes ({participants?.length || 0})
      </h2>
      <div className="flex-grow overflow-y-auto">
        {loading && <p>Carregando...</p>}
        <ul>
          {participants && participants.map(p => (
            <li key={p.uid} className="flex items-center justify-between p-2 rounded hover:bg-gray-700">
              <button onClick={() => handleUserSelect(p.uid)} className="flex items-center text-left focus:outline-none">
                <img src={p.photoURL} alt={p.displayName} className="w-8 h-8 rounded-full mr-3" />
                <span>{p.displayName}</span>
                {p.handRaised && <span className="ml-2">✋</span>}
              </button>
              {isAdmin && p.handRaised && (
                <div>
                  <button onClick={() => handleToggleMic(p.uid, true)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">Permitir</button>
                  <button onClick={() => handleToggleMic(p.uid, false)} className="bg-red-500 text-white px-2 py-1 rounded">Negar</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
