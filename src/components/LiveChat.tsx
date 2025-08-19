import React, 'react';
import { useAuth } from '@/hooks/useAuth';
import { ref, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/services/firebase';
import { useListVals } from 'react-firebase-hooks/database';

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
  const [messages, loading] = useListVals<ChatMessage>(messagesRef);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() === '' || !user) return;

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
        {messages && messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.authorId === user?.uid ? 'text-right' : ''}`}>
            <p className="text-xs text-gray-400">{msg.authorName}</p>
            <p className={`inline-block p-2 rounded-lg ${msg.authorId === user?.uid ? 'bg-blue-600' : 'bg-gray-700'}`}>
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-grow bg-gray-700 rounded-l-lg p-2 focus:outline-none"
          placeholder="Digite sua mensagem..."
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-r-lg hover:bg-blue-700">
          Enviar
        </button>
      </form>
    </div>
  );
};
