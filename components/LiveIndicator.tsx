import React from 'react';
import { ref } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useListVals } from 'react-firebase-hooks/database';

export const LiveIndicator: React.FC = () => {
  const participantsRef = ref(rtdb, `liveSessions/current/participants`);
  const [participants] = useListVals(participantsRef);
  const liveSessionRef = ref(rtdb, `liveSessions/current/isLive`);
  const [isLive] = useListVals<boolean>(liveSessionRef);

  if (!isLive || !participants || participants.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full flex items-center space-x-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
      <span>AO VIVO | {participants.length} assistindo</span>
    </div>
  );
};
