import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  onEnded: () => void; // Callback para quando o vídeo terminar
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Adiciona o event listener
      videoElement.addEventListener('ended', onEnded);
      
      // Função de limpeza para remover o listener quando o componente desmontar
      return () => {
        videoElement.removeEventListener('ended', onEnded);
      };
    }
  }, [src, onEnded]); // Re-executa se a fonte do vídeo ou a função de callback mudarem

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-lg ring-1 ring-gray-700">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        autoPlay // Adicionado para iniciar o vídeo automaticamente
        src={src}
        key={src} // Força a re-renderização se o src mudar
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>
    </div>
  );
};
