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

interface MeetUIProps {
  appId: string;
  channelName: string;
  token: string;
  uid: string;
  isAdmin: boolean;
  isPaused: boolean;
  onPause: () => void;
}

const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const MeetUI: React.FC<MeetUIProps> = ({ appId, channelName, token, uid, isAdmin, isPaused, onPause }) => {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);

  useEffect(() => {
    const joinChannel = async () => {
      try {
        await client.join(appId, channelName, token, uid);

        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();

        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);
      } catch (error) {
        console.error('Failed to join channel and publish:', error);
      }
    };

    const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
      await client.subscribe(user, mediaType);
      setRemoteUsers(prevUsers => [...prevUsers, user]);
      if (mediaType === 'audio') {
        user.audioTrack?.play();
      }
    };

    const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
      setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
    };

    client.on('user-published', handleUserPublished);
    client.on('user-unpublished', handleUserUnpublished);

    joinChannel();

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      screenTrack?.close();
      client.leave();
      client.off('user-published', handleUserPublished);
      client.off('user-unpublished', handleUserUnpublished);
    };
  }, [appId, channelName, token, uid, localAudioTrack, localVideoTrack, screenTrack]);

  const handleToggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleToggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenTracks = await AgoraRTC.createScreenVideoTrack({}, "auto");
        const trackToPublish = Array.isArray(screenTracks) ? screenTracks[0] : screenTracks;
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
    }
  };

  const handleLeave = () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    client.leave();
    // Here you might want to trigger a navigation or state change in the parent component
    alert('You have left the call.');
  };

  return (
    <div className="w-full h-screen bg-gray-800 relative">
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
          <h2 className="text-white text-4xl font-bold">LIVE EM PAUSA</h2>
        </div>
      )}
      <VideoGrid localVideoTrack={localVideoTrack} screenTrack={screenTrack} remoteUsers={remoteUsers} />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-1/4">
        <VolumeIndicator audioTrack={localAudioTrack} />
      </div>
      <Controls
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
      />
    </div>
  );
};
