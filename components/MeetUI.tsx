import React, { useState, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  ILocalVideoTrack,
} from 'agora-rtc-sdk-ng';
import { VideoGrid } from './VideoGrid';
import { Controls } from './Controls';
import { VolumeIndicator } from './VolumeIndicator';
import { ref, set, onDisconnect, serverTimestamp, update, onValue } from 'firebase/database';
import { rtdb } from '../services/firebase';

interface MeetUIProps {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
  displayName: string;
  isAdmin: boolean;
  isPaused: boolean;
  onPause: () => void;
  onLeave: () => void;
}

export const MeetUI: React.FC<MeetUIProps> = ({ appId, channelName, token, uid, displayName, isAdmin, isPaused, onPause, onLeave }) => {
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isMicEnabledByAdmin, setIsMicEnabledByAdmin] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      const participantRef = ref(rtdb, `liveSessions/${channelName}/participants/${uid}/micEnabled`);
      const unsubscribe = onValue(participantRef, (snapshot) => {
        setIsMicEnabledByAdmin(snapshot.val() === true);
      });
      return () => unsubscribe();
    }
  }, [isAdmin, channelName, uid]);

  useEffect(() => {
    const participantRef = ref(rtdb, `liveSessions/current/participants/${uid}`);

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      if (mediaType === 'video') {
        setRemoteUsers(prevUsers => {
          if (prevUsers.find(u => u.uid === user.uid)) {
            return prevUsers;
          }
          return [...prevUsers, user];
        });
      }
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
    };

    const joinChannel = async () => {
      client.on('user-published', handleUserPublished);
      client.on('user-unpublished', handleUserUnpublished);

      if (isAdmin) {
        await client.join(appId, channelName, token, uid);
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.join(appId, channelName, token, uid);
        await client.setClientRole('audience');
      }
      
      // Set presence
      const presenceData = {
        uid,
        displayName: displayName,
        joinedAt: serverTimestamp(),
      };
      await set(participantRef, presenceData);
      onDisconnect(participantRef).remove();
    };

    joinChannel().catch(console.error);

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      screenTrack?.close();
      setRemoteUsers([]);
      client.leave();
    };
  }, [appId, channelName, token, uid, isAdmin, client]);

  const handleToggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleToggleVideo = async () => {
    if (!localVideoTrack) {
      try {
        const newVideoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalVideoTrack(newVideoTrack);
        if (!isScreenSharing) {
          await client.publish(newVideoTrack);
        }
        setIsVideoEnabled(true);
      } catch (error) {
        console.error('Failed to create video track', error);
      }
    } else {
      try {
        if (!isScreenSharing) {
          await client.unpublish(localVideoTrack);
        }
        localVideoTrack.close();
        setLocalVideoTrack(null);
        setIsVideoEnabled(false);
      } catch (error) {
        console.error('Failed to stop video track', error);
      }
    }
  };

  const stopScreenShare = async () => {
    try {
      if (screenTrack) {
        await client.unpublish(screenTrack);
        screenTrack.close();
        setScreenTrack(null);
      }
      if (localVideoTrack) {
        await client.publish(localVideoTrack);
      }
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTracks = await AgoraRTC.createScreenVideoTrack({}, "auto");
        const trackToPublish = Array.isArray(screenTracks) ? screenTracks[0] : screenTracks;
        
        trackToPublish.on("track-ended", () => {
          stopScreenShare();
        });

        setScreenTrack(trackToPublish);

        if (localVideoTrack) {
          await client.unpublish(localVideoTrack);
        }
        await client.publish(trackToPublish);
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    } else {
      await stopScreenShare();
    }
  };

  const handleLeave = () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    screenTrack?.close();
    client.leave();
    onLeave();
  };

  const handleRaiseHand = () => {
    const participantRef = ref(rtdb, `liveSessions/${channelName}/participants/${uid}`);
    update(participantRef, { handRaised: !isHandRaised });
    setIsHandRaised(!isHandRaised);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-800 relative">
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
          <h2 className="text-white text-4xl font-bold">VOLTAMOS JA</h2>
        </div>
      )}
      <div className="flex-grow">
        <VideoGrid localVideoTrack={localVideoTrack} screenTrack={screenTrack} remoteUsers={remoteUsers} />
      </div>
      <Controls
        audioTrack={localAudioTrack}
        onToggleAudio={handleToggleAudio}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        onPause={onPause}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isPaused={isPaused}
        isAdmin={isAdmin}
        onRaiseHand={handleRaiseHand}
        isHandRaised={isHandRaised}
        isMicEnabledByAdmin={isMicEnabledByAdmin}
      />
    </div>
  );
};
