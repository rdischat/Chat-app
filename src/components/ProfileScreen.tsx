import React from 'react';
import { motion } from 'motion/react';
import { LogOut, Edit2, Settings, Bell, Shield, HelpCircle, ChevronRight, Camera } from 'lucide-react';
import { auth } from '../firebase';

export function ProfileScreen({ currentUser }: { currentUser: any }) {
  const handleLogout = () => {
    auth.signOut();
  };

  const menuItems = [
    { icon: <Settings size={20} />, label: 'Settings', color: 'text-slate-700 dark:text-slate-300' },
    { icon: <Bell size={20} />, label: 'Notifications', color: 'text-emerald-500' },
    { icon: <Shield size={20} />, label: 'Privacy & Security', color: 'text-blue-500' },
    { icon: <HelpCircle size={20} />, label: 'Help & Support', color: 'text-purple-500' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#f8f9fa] dark:bg-[#121212] overflow-y-auto pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between sticky top-0 bg-[#f8f9fa]/80 dark:bg-[#121212]/80 backdrop-blur-xl z-10">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Profile</h1>
        <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <Edit2 size={20} />
        </button>
      </div>

      <div className="px-6 mt-4">
        {/* Profile Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1a1a1a] rounded-[28px] p-6 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-[#6C5CE7]/20 to-[#4A00E0]/20 dark:from-[#6C5CE7]/10 dark:to-[#4A00E0]/10" />
          
          <div className="relative mt-4 mb-4 group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] p-[3px] shadow-lg">
              <div className="w-full h-full rounded-full bg-white dark:bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0]">
                    {currentUser?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-[#222] rounded-full flex items-center justify-center shadow-md border border-slate-100 dark:border-white/10 text-[#6C5CE7] dark:text-[#8a7df0] opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={16} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {currentUser?.displayName || 'User'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {currentUser?.email}
          </p>

          <div className="w-full flex gap-3">
            <button className="flex-1 py-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white rounded-xl font-medium transition-colors text-sm">
              Edit Profile
            </button>
            <button className="flex-1 py-3 bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] hover:shadow-[0_4px_15px_rgba(108,92,231,0.4)] text-white rounded-xl font-medium transition-all text-sm">
              Share Profile
            </button>
          </div>
        </motion.div>

        {/* Menu List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white dark:bg-[#1a1a1a] rounded-[28px] p-2 shadow-sm border border-slate-100 dark:border-white/5"
        >
          {menuItems.map((item, index) => (
            <button key={index} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{item.label}</span>
              </div>
              <ChevronRight size={20} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors" />
            </button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-2xl font-medium transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
