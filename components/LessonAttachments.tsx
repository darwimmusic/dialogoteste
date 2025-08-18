import React from 'react';
import type { Attachment } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

interface LessonAttachmentsProps {
  attachments: Attachment[];
}

export const LessonAttachments: React.FC<LessonAttachmentsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-3">Conteúdo da Aula</h3>
      <ul className="space-y-2">
        {attachments.map((file, index) => (
          <li key={index}>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center justify-between w-full text-left p-3 rounded-md transition-colors bg-gray-700 hover:bg-gray-600 text-gray-300"
            >
              <span className="font-medium truncate">{file.name}</span>
              <DownloadIcon className="w-5 h-5 text-gray-400" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};
