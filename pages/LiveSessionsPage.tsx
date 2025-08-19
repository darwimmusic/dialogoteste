import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { LiveChat } from '../components/LiveChat';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
const TOKEN_SERVICE_URL = import.meta.env.VITE_TOKEN_SERVICE_URL;

const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const LiveSessionsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const localVideoPlayerRef = useRef<HTMLDivElement>(null);
  const remoteVideoPlayerRef = useRef<HTMLDivElement>(null);

  const liveSessionRef = doc(db, 'liveSessions', 'current');
  const [liveSessionData, loading] = useDocumentData(liveSessionRef);

  useEffect(() => {
    if (liveSessionData) {
      setIsLive(liveSessionData.isLive);
    }
  }, [liveSessionData]);

  const getToken = async (channelName: string) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`${TOKEN_SERVICE_URL}/get-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ channelName }),
      });
      if (!response.ok) throw new Error('Failed to fetch token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error fetching token:', error);
      return null;
    }
  };

  const startLiveSession = async () => {
    if (!user) return;
    const channelName = `live_${user.uid}_${Date.now()}`;
    const token = await getToken(channelName);
    if (!token) return alert('Could not get access token.');

    try {
      await client.join(APP_ID, channelName, token, user.uid);
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      if (localVideoPlayerRef.current) {
        videoTrack.play(localVideoPlayerRef.current);
      }
      await client.publish([audioTrack, videoTrack]);
      await setDoc(liveSessionRef, {
        isLive: true,
        hostId: user.uid,
        hostName: user.displayName,
        channelName: channelName,
        startedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to start live session:', error);
    }
  };

  const stopLiveSession = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    await client.leave();
    await setDoc(liveSessionRef, { isLive: false }, { merge: true });
  };

  useEffect(() => {
    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio') => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUser(user);
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };
    const handleUserUnpublished = () => {
      setRemoteUser(null);
    };

    if (!isAdmin && isLive && user && liveSessionData?.channelName) {
      getToken(liveSessionData.channelName).then(token => {
        if (token) {
          client.join(APP_ID, liveSessionData.channelName, token, user.uid).catch(e => console.error(e));
        }
      });
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);
    }

    return () => {
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
      if (!isAdmin && client.connectionState === 'CONNECTED') {
        client.leave();
      }
    };
  }, [isLive, user, isAdmin, liveSessionData]);

  useEffect(() => {
    if (remoteUser && remoteVideoPlayerRef.current) {
      remoteUser.videoTrack?.play(remoteVideoPlayerRef.current);
    }
  }, [remoteUser]);

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Aula ao Vivo</h1>
      
      {isAdmin && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">Painel do Apresentador</h2>
          {isLive ? (
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

      {isLive && liveSessionData?.channelName ? (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow bg-black aspect-video">
            {isAdmin ? (
              <div className="w-full h-full" ref={localVideoPlayerRef}>
                <p className="text-white text-center p-2">Sua Câmera</p>
              </div>
            ) : (
              <div className="w-full h-full" ref={remoteVideoPlayerRef}>
                {!remoteUser && <p className="text-white text-center p-4">Aguardando o apresentador...</p>}
              </div>
            )}
          </div>
          <div className="w-full md:w-96 h-96 md:h-auto">
            <LiveChat sessionId={liveSessionData.channelName} />
          </div>
        </div>
      ) : (
        <p className="text-gray-400 text-center mt-8">Nenhuma aula ao vivo no momento.</p>
      )}
    </div>
  );
};
