import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, rtdb } from '../services/firebase';
import { ref, set, remove, onDisconnect } from 'firebase/database';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { getToken } from '../services/agoraService';
import { MeetUI } from '../components/MeetUI';
import { SidebarTabs } from '../components/SidebarTabs';
import { LiveIndicator } from '../components/LiveIndicator';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export const LiveSessionsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  const liveSessionRef = doc(db, 'liveSessions', 'current');
  const [liveSessionData, loading] = useDocumentData(liveSessionRef);

  useEffect(() => {
    // Logic for students to join the call
    if (!isAdmin && liveSessionData?.isLive && user && liveSessionData.channelName) {
      getToken(liveSessionData.channelName, user).then(fetchedToken => {
        if (fetchedToken) {
          setToken(fetchedToken);
          setIsInCall(true);
        }
      });
    } else if (!isAdmin) {
      setIsInCall(false);
    }
    // Admin joining logic is handled by startLiveSession and rejoinLiveSession
  }, [liveSessionData, user, isAdmin]);

  useEffect(() => {
    // Auto-rejoin for admin when unpausing
    if (isAdmin && liveSessionData?.isLive && !liveSessionData.isPaused && !isInCall) {
      rejoinLiveSession();
    }
  }, [liveSessionData, isAdmin, isInCall]);

  useEffect(() => {
    if (!user || !liveSessionData?.channelName) return;

    const participantRef = ref(rtdb, `liveSessions/${liveSessionData.channelName}/participants/${user.uid}`);

    if (isInCall) {
      const participantData = {
        displayName: user.displayName || 'Anônimo',
        uid: user.uid,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'A'}&background=random`,
      };
      set(participantRef, participantData);
      onDisconnect(participantRef).remove();
    } else {
      remove(participantRef);
    }
  }, [isInCall, user, liveSessionData?.channelName]);

  const startLiveSession = async () => {
    if (!user) return;
    const channelName = `live_${user.uid}_${Date.now()}`;
    
    await setDoc(liveSessionRef, {
      isLive: true,
      hostId: user.uid,
      hostName: user.displayName,
      channelName: channelName,
      startedAt: serverTimestamp(),
    });

    const fetchedToken = await getToken(channelName, user);
    if (fetchedToken) {
      setToken(fetchedToken);
      setIsInCall(true);
    } else {
      alert('Could not get access token.');
    }
  };

  const stopLiveSession = async () => {
    if (user && liveSessionData?.channelName) {
      const participantRef = ref(rtdb, `liveSessions/${liveSessionData.channelName}/participants/${user.uid}`);
      remove(participantRef);
    }
    await setDoc(liveSessionRef, { isLive: false, isPaused: false }, { merge: true });
    setIsInCall(false);
    setToken(null);
  };

  const leaveLiveSession = () => {
    setIsInCall(false);
    setToken(null);
  };

  const togglePauseSession = async () => {
    if (liveSessionData) {
      await setDoc(liveSessionRef, { isPaused: !liveSessionData.isPaused }, { merge: true });
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  }

  if (isInCall && token && user && liveSessionData?.channelName) {
    return (
      <div className="flex h-screen bg-gray-800 text-white">
        <div className="flex-grow flex flex-col">
          <MeetUI
            appId={APP_ID}
            channelName={liveSessionData.channelName}
            token={token}
            uid={user.uid}
            displayName={user.displayName || 'Anonymous'}
            isAdmin={isAdmin}
            isPaused={liveSessionData?.isPaused || false}
            onPause={togglePauseSession}
            onLeave={isAdmin ? stopLiveSession : leaveLiveSession}
          />
        </div>
        <div className="w-96 bg-gray-900">
          <SidebarTabs sessionId={liveSessionData.channelName} />
        </div>
      </div>
    );
  }

  const rejoinLiveSession = async () => {
    if (!user || !liveSessionData || !liveSessionData.channelName) return;
    const fetchedToken = await getToken(liveSessionData.channelName, user);
    if (fetchedToken) {
      setToken(fetchedToken);
      setIsInCall(true);
    } else {
      alert('Could not get access token to rejoin.');
    }
  };

  if (isAdmin && liveSessionData?.isLive && liveSessionData.hostId === user?.uid && !isInCall) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Uma live está em andamento.</h1>
        <button onClick={rejoinLiveSession} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl">
          VOLTAR AO AMBIENTE DA LIVE EM ANDAMENTO
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 relative">
      <LiveIndicator />
      <h1 className="text-4xl font-bold text-white mb-4">Aula ao Vivo</h1>
      
      {isAdmin && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Painel do Apresentador</h2>
          {liveSessionData?.isLive ? (
            <button onClick={stopLiveSession} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Encerrar Aula
            </button>
          ) : (
            <button onClick={startLiveSession} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
              Iniciar Aula ao Vivo
            </button>
          )}
        </div>
      )}

      {!liveSessionData?.isLive && (
        <p className="text-gray-400 text-center mt-8">Nenhuma aula ao vivo no momento.</p>
      )}
    </div>
  );
};
