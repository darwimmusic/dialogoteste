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
  onLeave: () => void;
}

const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export const MeetUI: React.FC<MeetUIProps> = ({ appId, channelName, token, uid, isAdmin, isPaused, onPause, onLeave }) => {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);

  useEffect(() => {
    const initTracks = async () => {
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
      } catch (error) {
        console.error('Failed to create local tracks', error);
      }
    };

    initTracks();
  }, []);

  useEffect(() => {
    const joinAndPublish = async () => {
      try {
        await client.join(appId, channelName, token, uid);
        if (localAudioTrack && localVideoTrack) {
          await client.publish([localAudioTrack, localVideoTrack]);
        }
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

    if (localAudioTrack && localVideoTrack) {
      joinAndPublish();
    }

    return () => {
      client.leave();
    };
  }, [appId, channelName, token, uid, localAudioTrack, localVideoTrack]);

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
      />
    </div>
  );
};
