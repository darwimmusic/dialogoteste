import React from 'react';
import { ref, update } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useListVals } from 'react-firebase-hooks/database';
import { useAuth } from '../hooks/useAuth';

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
  const { isAdmin } = useAuth();
  const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
  const [participants, loading] = useListVals<Participant>(participantsRef);

  const handleToggleMic = (uid: string, isEnabled: boolean) => {
    const participantRef = ref(rtdb, `liveSessions/${sessionId}/participants/${uid}`);
    update(participantRef, { micEnabled: isEnabled, handRaised: false });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
        Participantes ({participants?.length || 0})
      </h2>
      <div className="flex-grow overflow-y-auto">
        {loading && <p>Carregando...</p>}
        <ul>
          {participants && participants.map(p => (
            <li key={p.uid} className="flex items-center justify-between p-2 rounded hover:bg-gray-700">
              <div className="flex items-center">
                <img src={p.photoURL} alt={p.displayName} className="w-8 h-8 rounded-full mr-3" />
                <span>{p.displayName}</span>
                {p.handRaised && <span className="ml-2">✋</span>}
              </div>
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
