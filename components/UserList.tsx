import React from 'react';
import { ref } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useListVals } from 'react-firebase-hooks/database';

interface UserListProps {
  sessionId: string;
}

interface Participant {
  displayName: string;
  uid: string;
}

export const UserList: React.FC<UserListProps> = ({ sessionId }) => {
  const participantsRef = ref(rtdb, `liveSessions/current/participants`);
  const [participants, loading] = useListVals<Participant>(participantsRef);

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4 text-white">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">
        Participantes ({participants?.length || 0})
      </h2>
      <div className="flex-grow overflow-y-auto">
        {loading && <p>Carregando...</p>}
        <ul>
          {participants && participants.map(p => (
            <li key={p.uid} className="p-2 rounded hover:bg-gray-700">
              {p.displayName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
