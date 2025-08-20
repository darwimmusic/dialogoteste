import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { getToken } from '../services/agoraService';
import { MeetUI } from '../components/MeetUI';
import { LiveChat } from '../components/LiveChat';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;

export const LiveSessionsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);

  const liveSessionRef = doc(db, 'liveSessions', 'current');
  const [liveSessionData, loading] = useDocumentData(liveSessionRef);

  useEffect(() => {
    if (!isAdmin && liveSessionData?.isLive && user && liveSessionData.channelName) {
      getToken(liveSessionData.channelName, user).then(fetchedToken => {
        if (fetchedToken) {
          setToken(fetchedToken);
          setIsInCall(true);
        }
      });
    } else {
      setIsInCall(false);
    }
  }, [liveSessionData, user, isAdmin]);

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
    await setDoc(liveSessionRef, { isLive: false, isPaused: false }, { merge: true });
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
            isAdmin={isAdmin}
            isPaused={liveSessionData?.isPaused || false}
            onPause={togglePauseSession}
            onLeave={stopLiveSession}
          />
        </div>
        <div className="w-96 bg-gray-900">
          <LiveChat sessionId={liveSessionData.channelName} />
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
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Aula ao Vivo</h1>
      
      {isAdmin && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Painel do Apresentador</h2>
          {liveSessionData?.isLive ? (
            <button onClick={stopLiveSession} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Encerrar Aula
            </button>
          ) : (
            <button onClick={startLiveSession} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
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
