import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Friend, ChatMessage } from '../types';
import { sendMessage, onMessagesUpdate } from '../services/chatService';
import { useAuth } from '../hooks/useAuth';
import { SendIcon } from './icons/SendIcon';
import { LoadingSpinner } from './icons/LoadingSpinner';

interface ChatWindowProps {
  friend: Friend;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ friend }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onMessagesUpdate(friend.uid, (loadedMessages) => {
      setMessages(loadedMessages);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [friend.uid]);

  useEffect(() => {
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      try {
        await sendMessage(friend.uid, newMessage);
        setNewMessage('');
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho do Chat */}
      <header className="p-4 border-b border-gray-700">
        <Link to={`/profile/${friend.uid}`} className="flex items-center gap-3 group">
          <img src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} className="w-10 h-10 rounded-full group-hover:ring-2 group-hover:ring-purple-500 transition-all" />
          <h2 className="font-semibold text-lg group-hover:text-purple-400 transition-colors">{friend.displayName}</h2>
        </Link>
      </header>

      {/* Área de Mensagens */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.authorId !== user?.uid ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.authorId !== user?.uid ? 'bg-gray-700' : 'bg-purple-600'}`}>
                  <p className="text-sm text-white">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <footer className="p-4 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="w-full bg-gray-800 text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
