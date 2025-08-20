import React, { useState, useEffect } from 'react';
import { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface VolumeIndicatorProps {
  audioTrack: IMicrophoneAudioTrack | null;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ audioTrack }) => {
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    if (!audioTrack) {
      setVolumeLevel(0);
      return;
    }

    // Agora's getVolumeLevel returns a value between 0 and 1.
    const interval = setInterval(() => {
      const level = audioTrack.getVolumeLevel();
      setVolumeLevel(level * 100); // Convert to percentage for easier styling
    }, 200); // Update every 200ms

    return () => {
      clearInterval(interval);
    };
  }, [audioTrack]);

  return (
    <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-500 transition-all duration-100"
        style={{ width: `${volumeLevel}%` }}
      />
    </div>
  );
};
