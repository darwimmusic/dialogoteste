
import React, { useState, useRef, useEffect } from 'react';
import { askLessonTutor } from '../services/geminiService';
import type { AiTutorChatMessage } from '../types';
import { useAuth } from '../hooks/useAuth';
import { grantAchievement } from '../services/achievementService';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface AiTutorChatProps {
  transcript: string;
}

export const AiTutorChat: React.FC<AiTutorChatProps> = ({ transcript }) => {
  const [messages, setMessages] = useState<AiTutorChatMessage[]>([
    {
      role: 'model',
      content: 'Olá! Eu sou seu tutor de IA. Faça qualquer pergunta sobre esta aula.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: AiTutorChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('Usuário não autenticado.');
      }

      // Conquista: Primeira interação com o tutor de IA
      const userProfile = await getUserProfile(user.uid);
      if (userProfile && !userProfile.hasInteractedWithAITutor) {
        await updateUserProfile(user.uid, { hasInteractedWithAITutor: true });
        await grantAchievement(user.uid, 'first_ai_tutor_interaction');
      }

      const token = await user.getIdToken();
      const aiResponse = await askLessonTutor(input, transcript, token);
      const modelMessage: AiTutorChatMessage = { role: 'model', content: aiResponse };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: AiTutorChatMessage = {
        role: 'model',
        content: 'Ocorreu um erro. Por favor, tente novamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 flex flex-col h-[500px] ring-1 ring-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Tutor de IA</h3>
      <div className="flex-grow overflow-y-auto pr-2 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-300 flex-shrink-0 flex items-center justify-center font-bold text-gray-900">
                IA
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-white ${
                msg.role === 'user'
                  ? 'bg-blue-600 rounded-br-none'
                  : 'bg-gray-700 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-300 flex-shrink-0 flex items-center justify-center font-bold text-gray-900">
                IA
              </div>
            <div className="bg-gray-700 rounded-lg px-4 py-3 rounded-bl-none">
              <LoadingSpinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre a aula..."
          className="flex-grow bg-gray-700 border border-gray-600 rounded-full py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};
