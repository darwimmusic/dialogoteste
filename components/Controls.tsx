import React from 'react';

interface ControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  onToggleAudio,
  onToggleVideo,
  onLeave,
  isAudioEnabled,
  isVideoEnabled,
}) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-900 bg-opacity-70 flex justify-center items-center p-4 z-50">
      <div className="flex space-x-4">
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full ${isAudioEnabled ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-opacity-80`}
          aria-label={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {/* Placeholder for Mic Icon */}
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 7a5 5 0 0110 0v1h-1.172l-2-2H15V7a5 5 0 01-10 0v.172l-2 2V7zm-2.121 0A7.002 7.002 0 0110 3a7 7 0 017 7v1h1a1 1 0 011 1v2a1 1 0 01-1 1h-1.172l-2-2H18V9h-1v2.172l-2-2V9h-1v2.172l-2-2V9h-1v2.172l-2-2V9H8v2.172l-2-2V9H5v2.172l-2-2V9H2a1 1 0 01-1-1V8a1 1 0 011-1h1V7zM3.293 1.293a1 1 0 011.414 0L18 14.586a1 1 0 01-1.414 1.414L3.293 2.707a1 1 0 010-1.414z"/></svg>
        </button>
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full ${isVideoEnabled ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-opacity-80`}
          aria-label={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {/* Placeholder for Video Icon */}
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg>
        </button>
        <button
          onClick={onLeave}
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700"
          aria-label="Leave call"
        >
          {/* Placeholder for Leave Icon */}
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
        </button>
      </div>
    </div>
  );
};
