import React from 'react';
import { MessageSquare, Users, User } from 'lucide-react';

type Tab = 'news' | 'friends' | 'messages' | 'groups' | 'profile';

export function BottomNav({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (tab: Tab) => void }) {
  const tabs = [
    { id: 'messages', icon: MessageSquare, label: 'Chats' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 flex justify-around fixed bottom-0 w-full">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-[#6C5CE7]' : 'text-slate-400'}`}>
          <tab.icon size={24} />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
