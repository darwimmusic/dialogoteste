import React, { useState, useEffect, useRef } from 'react';
import { Friend, UserChatMessage } from '../types';
import { sendMessage, onMessagesUpdate } from '../services/chatService';
import { useAuth } from '../hooks/useAuth';
import { SendIcon } from './icons/SendIcon';

interface ChatWindowProps {
  friend: Friend;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ friend, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UserChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onMessagesUpdate(friend.uid, setMessages);
    return () => unsubscribe();
  }, [friend.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="fixed bottom-0 right-0 mb-4 mr-4 w-80 h-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg flex flex-col z-30">
      <header className="bg-gray-900 p-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-3">
          <img src={friend.photoURL || '/default-avatar.png'} alt={friend.displayName} className="w-8 h-8 rounded-full" />
          <h2 className="font-semibold text-white">{friend.displayName}</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
      </header>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.senderId !== user?.uid ? 'justify-start' : 'justify-end'}`}>
              <div className={`px-3 py-2 rounded-lg max-w-xs ${msg.senderId !== user?.uid ? 'bg-gray-700' : 'bg-purple-600'}`}>
                <p className="text-sm text-white">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="p-2 border-t border-gray-700">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="w-full bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:ring-purple-500 focus:border-purple-500"
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full">
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatWindow;
