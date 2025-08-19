import React, { useRef, useEffect } from 'react';
import { IAgoraRTCRemoteUser, ICameraVideoTrack, IRemoteVideoTrack } from 'agora-rtc-sdk-ng';

interface VideoGridProps {
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: IAgoraRTCRemoteUser[];
}

const VideoPlayer: React.FC<{ videoTrack: ICameraVideoTrack | IRemoteVideoTrack | undefined; userId: string | number }> = ({ videoTrack, userId }) => {
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
    <div ref={playerRef} className="w-full h-full bg-black rounded-lg overflow-hidden relative">
      <p className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded text-sm">{`User ${userId}`}</p>
    </div>
  );
};

export const VideoGrid: React.FC<VideoGridProps> = ({ localVideoTrack, remoteUsers }) => {
  const participantsCount = 1 + remoteUsers.length;

  // Basic grid layout calculation
  const gridCols = participantsCount > 4 ? 'grid-cols-3' : 'grid-cols-2';
  const gridRows = participantsCount > 2 ? 'grid-rows-2' : 'grid-rows-1';

  return (
    <div className={`w-full h-full grid gap-4 p-4 ${gridCols} ${gridRows}`}>
      {localVideoTrack && (
        <div className="aspect-video">
          <VideoPlayer videoTrack={localVideoTrack} userId="Me" />
        </div>
      )}
      {remoteUsers.map(user => (
        <div key={user.uid} className="aspect-video">
          <VideoPlayer videoTrack={user.videoTrack} userId={user.uid} />
        </div>
      ))}
    </div>
  );
};
