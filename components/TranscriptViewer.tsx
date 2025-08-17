
import React from 'react';

interface TranscriptViewerProps {
  transcript: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 h-full ring-1 ring-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Transcrição da Aula</h3>
      <div className="prose prose-invert prose-sm max-h-[calc(100vh-250px)] overflow-y-auto text-gray-300 leading-relaxed whitespace-pre-wrap">
        {transcript}
      </div>
    </div>
  );
};
