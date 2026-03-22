import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Send,
  Paperclip,
  MoreVertical,
  Smile,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import EmojiPicker from "emoji-picker-react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
}

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

export function ChatScreen({
  chat,
  messages,
  onSendMessage,
  onBack,
  currentUser,
}: {
  chat: Chat;
  messages: Message[];
  onSendMessage: (
    text: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
  ) => void;
  onBack: () => void;
  currentUser: any;
}) {
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (text.trim() || selectedFile) {
      if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onSendMessage(
            text,
            reader.result as string,
            selectedFile.type,
            selectedFile.name,
          );
          setText("");
          setSelectedFile(null);
          setFilePreview(null);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        onSendMessage(text);
        setText("");
      }
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setText((prevInput) => prevInput + emojiObject.emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  return (
    <div
      id="chat-screen"
      className="h-full flex flex-col bg-[#f8f9fa] dark:bg-[#121212] transition-colors duration-300 relative"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-4 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6C5CE7]/10 to-[#4A00E0]/10 dark:from-[#6C5CE7]/20 dark:to-[#4A00E0]/20 flex items-center justify-center text-[#6C5CE7] dark:text-[#8a7df0] font-bold overflow-hidden">
              {chat.avatar ? (
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                chat.name[0].toUpperCase()
              )}
            </div>
            {chat.isOnline !== false && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1a1a1a] rounded-full" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {chat.name}
            </div>
            <div className="text-[11px] text-emerald-500 font-medium">
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#6C5CE7] dark:hover:text-[#8a7df0] hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-[#6C5CE7] dark:hover:text-[#8a7df0] hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div id="chat-container" className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                px-4 py-2.5 max-w-[75%] shadow-sm flex flex-col
                ${
                  isMe
                    ? "bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] text-white rounded-[18px] rounded-tr-[4px]"
                    : "bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-[18px] rounded-tl-[4px] border border-slate-100 dark:border-white/5"
                }
              `}
              >
                {msg.fileUrl && (
                  <div className="mb-2">
                    {msg.fileType?.startsWith("image/") ? (
                      <img
                        src={msg.fileUrl}
                        alt="Attachment"
                        className="rounded-xl max-w-full h-auto max-h-60 object-cover"
                      />
                    ) : (
                      <a
                        href={msg.fileUrl}
                        download={msg.fileName}
                        className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-xl hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                      >
                        <FileText size={24} />
                        <span className="text-sm truncate">
                          {msg.fileName || "Download File"}
                        </span>
                      </a>
                    )}
                  </div>
                )}
                {msg.text && (
                  <p className="text-[15px] leading-relaxed break-words">
                    {msg.text}
                  </p>
                )}
                <div
                  className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? "text-white/70 justify-end" : "text-slate-400 dark:text-slate-500 justify-start"}`}
                >
                  {msg.createdAt?.toDate
                    ? msg.createdAt
                        .toDate()
                        .toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                    : "..."}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[80px] left-4 right-4 bg-white dark:bg-[#222] p-3 rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 flex items-center gap-3 z-20"
          >
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-500">
                <FileText size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setFilePreview(null);
              }}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[80px] left-4 z-30"
          >
            <div className="shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10">
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div
        id="input-bar"
        className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl p-3 border-t border-slate-200/50 dark:border-white/5 pb-[env(safe-area-inset-bottom,12px)] relative z-20"
      >
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 dark:text-slate-500 hover:text-[#6C5CE7] dark:hover:text-[#8a7df0] transition-colors shrink-0"
          >
            <Paperclip size={22} />
          </button>
          <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-[24px] border border-transparent focus-within:border-[#6C5CE7]/30 focus-within:bg-white dark:focus-within:bg-[#222] transition-all flex items-end min-h-[48px] relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute left-3 bottom-3 text-slate-400 hover:text-[#6C5CE7] transition-colors"
            >
              <Smile size={20} />
            </button>
            <textarea
              className="w-full bg-transparent pl-10 pr-3 py-3 max-h-32 focus:outline-none text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none overflow-y-auto no-scrollbar"
              placeholder="Message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              style={{ minHeight: "48px" }}
            />
          </div>
          {text.trim() || selectedFile ? (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleSend}
              className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#6C5CE7] to-[#4A00E0] text-white rounded-full hover:shadow-[0_4px_15px_rgba(108,92,231,0.4)] transition-all flex items-center justify-center"
            >
              <Send size={20} className="ml-1" />
            </motion.button>
          ) : (
            <button className="w-12 h-12 shrink-0 text-slate-400 dark:text-slate-500 hover:text-[#6C5CE7] dark:hover:text-[#8a7df0] transition-colors flex items-center justify-center">
              <Phone size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
