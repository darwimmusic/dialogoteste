import React, { useRef, useEffect } from 'react';
import { IAgoraRTCRemoteUser, ICameraVideoTrack, IRemoteVideoTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoGridProps {
  localVideoTrack: ICameraVideoTrack | null;
  screenTrack: ILocalVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
}

const VideoPlayer: React.FC<{ videoTrack: ICameraVideoTrack | IRemoteVideoTrack | ILocalVideoTrack | undefined; userId: string | number; className?: string }> = ({ videoTrack, userId, className = '' }) => {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playerRef.current && videoTrack) {
      videoTrack.play(playerRef.current);
    }
    return () => {
      videoTrack?.stop();
    };
  }, [videoTrack]);

  return (
    <div ref={playerRef} className={`w-full h-full bg-black rounded-lg overflow-hidden relative ${className}`}>
      <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">{`User ${userId}`}</p>
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({ localVideoTrack, screenTrack, remoteUsers }) => {
  if (screenTrack) {
    return (
      <div className="w-full h-full relative p-4">
        <VideoPlayer videoTrack={screenTrack} userId="Your Screen" />
        {localVideoTrack && (
          <div className="absolute top-6 left-6 w-48 h-36 z-10">
            <VideoPlayer videoTrack={localVideoTrack} userId="Me" />
          </div>
        )}
      </div>
    );
  }

  const participants = [
    ...(localVideoTrack ? [{ uid: 'local', videoTrack: localVideoTrack }] : []),
    ...remoteUsers,
  ];
  const participantsCount = participants.length;
  const gridCols = participantsCount > 4 ? 'grid-cols-3' : (participantsCount > 1 ? 'grid-cols-2' : 'grid-cols-1');
  const gridRows = participantsCount > 2 ? 'grid-rows-2' : 'grid-rows-1';

  return (
    <div className={`w-full h-full grid gap-4 p-4 ${gridCols} ${gridRows}`}>
      {participants.map(p => (
        <div key={p.uid} className="aspect-video">
          <VideoPlayer videoTrack={p.videoTrack} userId={p.uid === 'local' ? 'Me' : p.uid} />
        </div>
      ))}
    </div>
  );
};
