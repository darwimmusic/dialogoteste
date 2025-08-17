import React from 'react';

interface VideoPlayerProps {
  src: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src }) => {
  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg ring-1 ring-gray-700">
      <video
        className="w-full h-full"
        controls
        src={src}
        key={src} // Add key to force re-render if src changes
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>
    </div>
  );
};
