import React, { useState } from "react";
import { Search, UserPlus, User, Loader2, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserProfile {
  uid: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: any;
  fromUser?: UserProfile;
}

export function ContactsScreen({
  friends,
  friendRequests,
  sentRequests,
  onSearch,
  searchResults,
  searchLoading,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onClearSearch,
}: {
  friends: UserProfile[];
  friendRequests: FriendRequest[];
  sentRequests: string[];
  onSearch: (query: string) => void;
  searchResults: UserProfile[];
  searchLoading: boolean;
  onSendRequest: (user: UserProfile) => void;
  onAcceptRequest: (reqId: string) => void;
  onRejectRequest: (reqId: string) => void;
  onClearSearch: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl sticky top-0 z-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
          Contacts
        </h1>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by UserID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) onClearSearch();
            }}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#222] border border-slate-200 dark:border-white/5 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/30 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 transition-all shadow-sm"
          />
          {searchLoading && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#6C5CE7]"
              size={20}
            />
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-24">
        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-5 shadow-sm border border-slate-100 dark:border-white/5"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-[15px]">
                  Search Results
                </h3>
                <button
                  onClick={onClearSearch}
                  className="text-[#6C5CE7] text-[13px] font-medium hover:opacity-80 transition-opacity"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-3">
                {searchResults.map((u) => (
                  <div
                    key={u.uid}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[16px] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 rounded-full overflow-hidden flex items-center justify-center text-[#6C5CE7] font-bold text-lg">
                        {u.avatar ? (
                          <img
                            src={u.avatar}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          u.firstName[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-[15px]">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-slate-500 text-[13px]">
                          @{u.userId}
                        </p>
                      </div>
                    </div>
                    {friends.some((f) => f.uid === u.uid) ? (
                      <span className="text-[#6C5CE7] text-[11px] font-semibold bg-[#6C5CE7]/10 px-3 py-1 rounded-full">
                        Friend
                      </span>
                    ) : sentRequests.includes(u.uid) ? (
                      <span className="text-slate-400 text-[11px] font-semibold bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full">
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => onSendRequest(u)}
                        className="w-10 h-10 bg-[#6C5CE7] text-white rounded-full hover:shadow-[0_4px_15px_rgba(108,92,231,0.4)] transition-all flex items-center justify-center"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white text-[15px] px-2">
              Friend Requests
            </h3>
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-2 shadow-sm border border-slate-100 dark:border-white/5">
              {friendRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[16px] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 rounded-full overflow-hidden flex items-center justify-center text-[#6C5CE7] font-bold text-lg">
                      {req.fromUser?.avatar ? (
                        <img
                          src={req.fromUser.avatar}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        req.fromUser?.firstName?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-[15px]">
                        {req.fromUser?.firstName} {req.fromUser?.lastName}
                      </p>
                      <p className="text-slate-500 text-[13px]">
                        @{req.fromUser?.userId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAcceptRequest(req.id)}
                      className="w-10 h-10 bg-emerald-500 text-white rounded-full hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => onRejectRequest(req.id)}
                      className="w-10 h-10 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-red-500 rounded-full transition-colors flex items-center justify-center"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white text-[15px] px-2">
            My Contacts
          </h3>
          {friends.length > 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-[24px] p-2 shadow-sm border border-slate-100 dark:border-white/5">
              {friends.map((friend) => (
                <div
                  key={friend.uid}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-[16px] transition-colors cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 rounded-full overflow-hidden flex items-center justify-center text-[#6C5CE7] font-bold text-lg">
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        friend.firstName[0].toUpperCase()
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] rounded-full" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-[15px]">
                      {friend.firstName} {friend.lastName}
                    </p>
                    <p className="text-slate-500 text-[13px]">
                      @{friend.userId}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <User size={32} />
              </div>
              <p className="text-slate-500 text-[15px]">No contacts yet</p>
              <p className="text-slate-400 text-[13px] mt-1">
                Search for users to add them
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
