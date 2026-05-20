import { useState } from "react";
import { Bot, MessageCircle, PhoneCall, Users, X, Send } from "lucide-react";

const ZALO_URL = "https://zalo.me/";
const FACEBOOK_URL = "https://www.facebook.com/";

export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-blue-700 px-4 py-3 text-white">
            <div>
              <div className="text-sm font-black">AI Chatbot</div>
              <div className="text-xs font-semibold text-white/80">Tư vấn demo 24/7</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 p-2">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 bg-slate-50 p-4">
            <div className="max-w-[85%] rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
              Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-700 p-3 text-sm font-semibold text-white">
              Tôi muốn xem sản phẩm bán chạy.
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none"
              placeholder="Nhập tin nhắn..."
            />
            <button className="rounded-2xl bg-blue-700 p-3 text-white">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen(true)}
          className="group flex items-center rounded-full bg-blue-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Bot size={22} />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">AI Chatbot</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Mở hộp chat demo</span>
          </span>
        </button>

        <a
          href="#staff-chat"
          className="group flex items-center rounded-full bg-slate-900 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Users size={22} />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">Nhân viên</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Chat với CSKH</span>
          </span>
        </a>

        <a
          href={ZALO_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center rounded-full bg-cyan-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <PhoneCall size={22} />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">Zalo</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Mở Zalo shop</span>
          </span>
        </a>

        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center rounded-full bg-indigo-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <MessageCircle size={22} />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">Facebook</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Mở Messenger</span>
          </span>
        </a>
      </div>
    </>
  );
}
