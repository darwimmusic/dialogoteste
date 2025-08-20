import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ref, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '../services/firebase';
import { useList } from 'react-firebase-hooks/database';
import { grantAchievement } from '../services/achievementService';
import { getUserProfile, updateUserProfile } from '../services/userService';

interface LiveChatProps {
  sessionId: string;
}

interface ChatMessage {
  key?: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: number;
}

export const LiveChat: React.FC<LiveChatProps> = ({ sessionId }) => {
  const { user } = useAuth();
  const [text, setText] = React.useState('');
  const messagesRef = ref(rtdb, `liveChats/${sessionId}`);
  const [snapshots, loading] = useList(messagesRef);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(scrollToBottom, [snapshots]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === '' || !user) return;

    // Conquista: Primeira mensagem no chat ao vivo
    const userProfile = await getUserProfile(user.uid);
    if (userProfile && !userProfile.hasSentLiveChatMessage) {
      await updateUserProfile(user.uid, { hasSentLiveChatMessage: true });
      await grantAchievement(user.uid, 'first_live_chat_message');
    }

    await push(messagesRef, {
      authorId: user.uid,
      authorName: user.displayName || 'Anônimo',
      text: text,
      timestamp: serverTimestamp(),
    });
    setText('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Chat ao Vivo</h2>
      <div className="flex-grow overflow-y-auto mb-4 pr-2">
        {loading && <p>Carregando chat...</p>}
        {snapshots && snapshots.map((snapshot) => {
          const msg = snapshot.val() as ChatMessage;
          return (
            <div key={snapshot.key} className={`mb-2 ${msg.authorId === user?.uid ? 'text-right' : ''}`}>
              <p className="text-xs text-gray-400">{msg.authorName}</p>
              <p className={`inline-block p-2 rounded-lg ${msg.authorId === user?.uid ? 'bg-blue-600' : 'bg-gray-700'}`}>
                {msg.text}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex-shrink-0">
        <div className="flex items-center bg-blue-900 rounded-lg p-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow bg-transparent text-white placeholder-gray-400 focus:outline-none"
            placeholder="Digite sua mensagem..."
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50" disabled={!text.trim()}>
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm1.25-1.125a.75.75 0 10-1.5 0v2.25a.75.75 0 101.5 0v-2.25zM10 2a8 8 0 100 16 8 8 0 000-16zM7.75 9.25a.75.75 0 10-1.5 0v1.5a.75.75 0 101.5 0v-1.5zm4.5 0a.75.75 0 10-1.5 0v1.5a.75.75 0 101.5 0v-1.5z"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
};
