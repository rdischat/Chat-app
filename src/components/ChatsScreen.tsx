import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, MessageCircle, X, User } from 'lucide-react';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  participants: string[];
  avatar?: string;
  isOnline?: boolean;
}

export function ChatsScreen({ 
  chats, 
  friends,
  onSelectChat,
  onNewChat
}: { 
  chats: Chat[], 
  friends: any[],
  onSelectChat: (chat: Chat) => void,
  onNewChat: (friendId: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'contacts'>('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return true;
    if (activeTab === 'groups') return chat.participants.length > 2;
    if (activeTab === 'contacts') return chat.participants.length <= 2;
    return true;
  });

  const filteredFriends = friends.filter(f => 
    `${f.firstName} ${f.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300">
      <div className="px-6 pt-12 pb-4 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chats</h1>
          <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <Search size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6">
          {(['all', 'groups', 'contacts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-2 text-sm font-semibold transition-colors ${
                activeTab === tab 
                  ? 'text-[#6C5CE7] dark:text-[#8a7df0]' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <span className="capitalize">{tab === 'all' ? 'All Chats' : tab}</span>
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#6C5CE7] to-[#4A00E0] rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-3">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">No chats yet</p>
          </div>
        ) : (
          filteredChats.map((chat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={chat.id}
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectChat(chat)}
              className="flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a1a] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-white/5 cursor-pointer"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 dark:from-[#6C5CE7]/20 dark:to-[#4A00E0]/20 flex items-center justify-center text-[#6C5CE7] dark:text-[#8a7df0] font-bold text-xl overflow-hidden">
                  {chat.avatar ? (
                    <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    chat.name[0].toUpperCase()
                  )}
                </div>
                {chat.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate text-base">{chat.name}</h3>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{chat.time}</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate pr-4">{chat.lastMessage}</p>
              </div>
              
              {chat.unread > 0 && (
                <div className="w-6 h-6 bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-[#6C5CE7]/30">
                  {chat.unread}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <button 
        onClick={() => setShowNewChatModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgba(108,92,231,0.4)] hover:shadow-[0_8px_30px_rgba(108,92,231,0.6)] hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
            onClick={() => setShowNewChatModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-t-[32px] sm:rounded-[32px] h-[80vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Chat</h2>
                <button 
                  onClick={() => setShowNewChatModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 shrink-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search contacts..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredFriends.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                    <User size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No contacts found</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <button
                      key={friend.uid}
                      onClick={() => {
                        onNewChat(friend.uid);
                        setShowNewChatModal(false);
                      }}
                      className="w-full flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 dark:from-[#6C5CE7]/20 dark:to-[#4A00E0]/20 flex items-center justify-center text-[#6C5CE7] dark:text-[#8a7df0] font-bold overflow-hidden shrink-0">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          friend.firstName[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                          {friend.firstName} {friend.lastName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{friend.userId}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
