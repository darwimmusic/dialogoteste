
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { DownloadIcon } from './icons/DownloadIcon';
import { useAuth } from '../hooks/useAuth';
import { grantAchievement } from '../services/achievementService';
import { getUserProfile, updateUserProfile } from '../services/userService';

interface TranscriptViewerProps {
  summary: string;
  rawTranscript: string;
  lessonTitle: string;
  lessonId: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ summary, rawTranscript, lessonTitle, lessonId }) => {
  const { user } = useAuth();

  const handleDownloadTranscript = async () => {
    if (user) {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile && !userProfile.downloadedTranscripts?.includes(lessonId)) {
        const wasFirstDownload = (userProfile.downloadedTranscripts?.length || 0) === 0;

        const updatedDownloads = [...(userProfile.downloadedTranscripts || []), lessonId];
        await updateUserProfile(user.uid, { downloadedTranscripts: updatedDownloads });

        if (wasFirstDownload) {
          await grantAchievement(user.uid, 'first_transcript_download');
        }
      }
    }

    const blob = new Blob([rawTranscript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Sanitize title to create a valid filename
    const fileName = `Transcricao-${lessonTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white">Resumo da Aula</h3>
        <button
          onClick={handleDownloadTranscript}
          title="Baixar Transcrição Original"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <DownloadIcon className="w-4 h-4" />
          <span>Baixar Transcrição</span>
        </button>
      </div>
      <div className="prose prose-invert max-w-none text-gray-300 text-sm max-h-96 overflow-y-auto">
        <ReactMarkdown>{summary}</ReactMarkdown>
      </div>
    </div>
  );
};
