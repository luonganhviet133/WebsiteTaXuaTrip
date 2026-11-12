import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageCircle,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Listing, DirectChatMessage, MemberProfile } from '../types/index.ts';

interface DirectChatModalProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  userProfile: MemberProfile;
  onRegisterMember?: (name: string, phone: string) => void;
}

export const DirectChatModal: React.FC<DirectChatModalProps> = ({
  listing,
  isOpen,
  onClose,
  userProfile,
  onRegisterMember
}) => {
  // Chat trên web chưa có máy chủ chuyển tin tới chủ cơ sở: không hiển thị lời chào/trả lời
  // dưới danh nghĩa chủ cơ sở, chỉ hiển thị thông báo hệ thống nói rõ tin chưa được gửi.
  const systemMessage = (id: string): DirectChatMessage => ({
    id,
    listingId: listing.id,
    senderId: 'system',
    senderName: 'Thông báo hệ thống',
    senderRole: 'admin',
    text: `Tin nhắn trên web chưa được chuyển tới ${listing.title}. Để hỏi phòng, giá và đường đi, vui lòng gọi hoặc nhắn Zalo ${listing.phone}.`,
    timestamp: 'Vừa xong',
    isRead: true
  });

  const [messages, setMessages] = useState<DirectChatMessage[]>([systemMessage('init-msg-1')]);
  const [inputText, setInputText] = useState('');
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(!userProfile?.phone);
  const [regName, setRegName] = useState(userProfile?.name || '');
  const [regPhone, setRegPhone] = useState(userProfile?.phone || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Chào cơ sở, ngày cuối tuần tới bên mình còn phòng view mây không ạ?',
    'Cho em hỏi đường lên cơ sở xe 16 chỗ hoặc xe máy có dễ đi không?',
    'Giá phòng đã bao gồm ăn sáng đặc sản và trà Shan Tuyết chưa ạ?',
    'Nhờ cơ sở tư vấn thời điểm săn mây đẹp nhất tuần này với ạ!'
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Check if user is registered member
    if (!userProfile?.phone) {
      setShowRegisterPrompt(true);
      return;
    }

    const newMsg: DirectChatMessage = {
      id: `msg-${Date.now()}`,
      listingId: listing.id,
      senderId: userProfile.id,
      senderName: userProfile.name || 'Du khách',
      senderRole: 'traveler',
      text,
      timestamp: 'Vừa xong',
      isRead: false
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setMessages((prev) => [...prev, systemMessage(`notice-${Date.now()}`)]);
  };

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) return;
    if (onRegisterMember) {
      onRegisterMember(regName.trim(), regPhone.trim());
    }
    setShowRegisterPrompt(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 flex flex-col h-[600px] max-h-[92vh]">
        {/* Header */}
        <div className="bg-brand-800 text-white p-4 flex items-center justify-between gap-3 shadow-sm shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={listing.coverImage}
                alt={listing.title}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/30"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm truncate">{listing.title}</h3>
                <span className="text-xs bg-amber-400/20 text-amber-200 border border-amber-300/40 px-2 py-0.5 rounded-full font-bold shrink-0">
                  Bản demo
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {listing.area} · Hotline: {listing.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Verification Banner */}
        <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center justify-between text-xs text-teal-900 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              {userProfile?.phone ? (
                <>
                  Hội thoại bảo mật với tư cách: <strong>{userProfile.name}</strong> ({userProfile.phone})
                </>
              ) : (
                'Trò chuyện chỉ mở cho thành viên đã đăng ký nhằm chống spam & bảo vệ du khách.'
              )}
            </span>
          </div>
          {!userProfile?.phone && (
            <button
              type="button"
              onClick={() => setShowRegisterPrompt(true)}
              className="text-xs font-bold text-teal-700 underline hover:text-teal-800 cursor-pointer shrink-0 ml-2"
            >
              Đăng ký ngay
            </button>
          )}
        </div>

        {/* Register Prompt Overlay if not logged in */}
        {showRegisterPrompt && (
          <div className="bg-amber-50/95 border-b border-amber-200 p-4 shrink-0">
            <h4 className="text-xs font-extrabold text-amber-950 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span>Xác nhận thông tin thành viên để mở cuộc trò chuyện trực tiếp:</span>
            </h4>
            <form onSubmit={handleQuickRegister} className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Họ và tên của bạn"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                />
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại / Zalo"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-800"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRegisterPrompt(false)}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Để sau
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-800 text-white text-xs font-bold rounded-xl hover:bg-brand-700 cursor-pointer"
                >
                  Xác nhận thành viên
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70">
          {messages.map((msg) => {
            const isMe = msg.senderRole === 'traveler';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-xs text-slate-400 mb-1 font-medium px-1">
                  {msg.senderName} · {msg.timestamp}
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-brand-800 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}


          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 bg-slate-100/90 border-t border-slate-200/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
          <span className="text-xs text-slate-500 font-bold shrink-0 ml-1">Gợi ý hỏi:</span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              className="text-xs whitespace-nowrap bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Input Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              userProfile?.phone
                ? 'Nhập tin nhắn cho chủ cơ sở...'
                : 'Đăng ký thành viên để gửi tin nhắn...'
            }
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-800 focus:bg-white transition-all"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full bg-brand-800 hover:bg-brand-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
