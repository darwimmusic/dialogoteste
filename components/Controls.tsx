import React from 'react';
import { VolumeIndicator } from './VolumeIndicator';
import { IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

interface ControlsProps {
  audioTrack: IMicrophoneAudioTrack | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
  onPause: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  isPaused: boolean;
  isAdmin: boolean;
}

const ControlButton: React.FC<{ onClick: () => void; ariaLabel: string; className: string; children: React.ReactNode; label: string }> = ({ onClick, ariaLabel, className, children, label }) => (
  <div className="flex flex-col items-center">
    <button
      onClick={onClick}
      className={`p-3 rounded-full text-white hover:bg-opacity-80 ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
    <span className="text-white text-xs mt-1">{label}</span>
  </div>
);

export const Controls: React.FC<ControlsProps> = ({
  audioTrack,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  onPause,
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  isPaused,
  isAdmin,
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full bg-gray-900 bg-opacity-70 flex justify-center items-center p-4 z-50">
      <div className="flex items-center space-x-6">
        <div className="w-24">
          <VolumeIndicator audioTrack={audioTrack} />
        </div>
        
        <ControlButton
          onClick={onToggleAudio}
          className={isAudioEnabled ? 'bg-blue-600' : 'bg-gray-700'}
          ariaLabel={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          label="Microfone"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 7a5 5 0 0110 0v1h-1.172l-2-2H15V7a5 5 0 01-10 0v.172l-2 2V7zm-2.121 0A7.002 7.002 0 0110 3a7 7 0 017 7v1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1.172l-2-2H18V9h-1v2.172l-2-2V9h-1v2.172l-2-2V9h-1v2.172l-2-2V9H8v2.172l-2-2V9H5v2.172l-2-2V9H2a1 1 0 01-1-1V8a1 1 0 011-1h1V7zM3.293 1.293a1 1 0 011.414 0L18 14.586a1 1 0 01-1.414 1.414L3.293 2.707a1 1 0 010-1.414z"/></svg>
        </ControlButton>

        <ControlButton
          onClick={onToggleVideo}
          className={isVideoEnabled ? 'bg-blue-600' : 'bg-gray-700'}
          ariaLabel={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          label="Câmera"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
        </ControlButton>

        <ControlButton
          onClick={onToggleScreenShare}
          className={isScreenSharing ? 'bg-green-600' : 'bg-gray-700'}
          ariaLabel={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
          label="Espelhar Tela"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.5a.75.75 0 001.5 0v-8.5z"/><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 1.5a9.5 9.5 0 100-19 9.5 9.5 0 000 19z"/><path d="M12.99 4.01a.75.75 0 00-1.06-1.06l-2.5 2.5a.75.75 0 001.06 1.06l2.5-2.5z"/><path d="M7.01 4.01a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06-1.06l-2.5-2.5z"/></svg>
        </ControlButton>

        {isAdmin && (
          <ControlButton
            onClick={onPause}
            className={isPaused ? 'bg-yellow-500' : 'bg-gray-700'}
            ariaLabel={isPaused ? 'Resume live' : 'Pause live'}
            label="Pausar Live"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 6a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 5a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
          </ControlButton>
        )}

        <ControlButton
          onClick={onLeave}
          className="bg-red-600"
          ariaLabel="Leave call"
          label="Encerrar Live"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
        </ControlButton>
      </div>
    </div>
  );
};
