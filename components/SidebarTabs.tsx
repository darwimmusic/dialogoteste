import React, { useState } from 'react';
import { LiveChat } from './LiveChat';
import { UserList } from './UserList';

interface SidebarTabsProps {
  sessionId: string;
}

type Tab = 'chat' | 'participants';

export const SidebarTabs: React.FC<SidebarTabsProps> = ({ sessionId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-center font-semibold ${activeTab === 'chat' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2 text-center font-semibold ${activeTab === 'participants' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
        >
          Participantes
        </button>
      </div>
      <div className="flex-grow">
        {activeTab === 'chat' && <LiveChat sessionId={sessionId} />}
        {activeTab === 'participants' && <UserList sessionId={sessionId} />}
      </div>
    </div>
  );
};
