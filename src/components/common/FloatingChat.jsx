import { useState, useMemo, useRef, useEffect } from "react";
import { Bot, MessageCircle, Users, X, Send } from "lucide-react";
import { useCms } from "../../store/CmsStore";
import { useI18n } from "../../i18n";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";

const defaultCommunications = [
  { id: "1", name: "Zalo hỗ trợ CSKH", platform: "Zalo", value: "https://zalo.me/0931817801", status: "Active", active: true },
  { id: "2", name: "Messenger Fanpage", platform: "Messenger", value: "https://m.me/tri.nguyen.nam.minh", status: "Active", active: true },
  { id: "3", name: "Hotline Tư vấn 24/7", platform: "Hotline", value: "0931817801", status: "Maintenance", active: false }
];

const ZALO_LOGO = import.meta.env.VITE_ZALO_LOGO;
const MESSENGER_LOGO = import.meta.env.VITE_MESSENGER_LOGO;

function ChatLogoImage({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function FloatingChat() {
  const { state } = useCms();
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatType, setChatType] = useState("ai");
  const { t } = useI18n();
  const chatRef = useRef(null);
  const { toast, notify, dismiss } = useToast();

  useEffect(() => {
    function handleClickOutside(event) {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allCommunications = useMemo(() => {
    const currentStoreList = state.communications || [];
    const baseRows = defaultCommunications.map(d => currentStoreList.find(c => String(c.id) === String(d.id)) || d);
    const extraRows = currentStoreList.filter(c => !defaultCommunications.some(d => String(d.id) === String(c.id)));
    return [...baseRows, ...extraRows];
  }, [state.communications]);

  const isAvailable = (c) => {
    if (c.active === false) return false;
    const currentStatus = String(c.status || "Active").toLowerCase();
    if (currentStatus === "inactive" || currentStatus === "maintenance") return false;
    return true;
  };

  const ZALO_URL = useMemo(() => {
    const primaryZalo = allCommunications.find(c => String(c.id) === "1" && c.platform === "Zalo" && isAvailable(c));
    if (primaryZalo) return primaryZalo.value;
    const backupZalo = allCommunications.find(c => c.platform === "Zalo" && isAvailable(c));
    return backupZalo ? backupZalo.value : "";
  }, [allCommunications]);

  const FACEBOOK_URL = useMemo(() => {
    const primaryFB = allCommunications.find(c => String(c.id) === "2" && c.platform === "Messenger" && isAvailable(c));
    if (primaryFB) return primaryFB.value;
    const backupFB = allCommunications.find(c => c.platform === "Messenger" && isAvailable(c));
    return backupFB ? backupFB.value : "";
  }, [allCommunications]);

  const handleNavigation = (e, url, defaultPrefix) => {
    e.preventDefault();
    if (!url || url.trim() === "" || url === defaultPrefix) {
      notify("error", t("chat.notAvailable") || "Đường link đang bảo trì hoặc không khả dụng. Vui lòng quay lại sau!");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={chatRef} className="fixed bottom-0 right-0 z-[100000]">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <div className="hidden md:flex fixed bottom-8 right-4 flex-col items-end gap-2.5">
        {open && (
          <div className="absolute bottom-[190px] right-0 w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="bg-blue-700 px-4 pt-3 pb-2 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-black">{t("chat.title") || "Trung Tâm Hỗ Trợ"}</div>
                  <div className="text-xs font-semibold text-white/80">{t("chat.subtitle") || "Tư vấn giải đáp 24/7"}</div>
                </div>
                <button onClick={() => setOpen(false)} aria-label={t("chat.close") || "Đóng"} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"><X size={16} /></button>
              </div>
              <div className="flex rounded-xl bg-black/20 p-1 text-xs font-bold">
                <button onClick={() => setChatType("ai")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${chatType === "ai" ? "bg-white text-blue-700 shadow-sm" : "text-white hover:bg-white/10"}`}><Bot size={14} /> {t("chat.aiTab") || "AI Chatbot"}</button>
                <button onClick={() => setChatType("staff")} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${chatType === "staff" ? "bg-white text-blue-700 shadow-sm" : "text-white hover:bg-white/10"}`}><Users size={14} /> {t("chat.staffTab") || "Nhân viên"}</button>
              </div>
            </div>
            <div className="space-y-3 bg-slate-50 p-4 min-h-[140px] max-h-[250px] overflow-y-auto">
              {chatType === "ai" ? (
                <>
                  <div className="max-w-[85%] rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">{t("chat.aiWelcome") || "Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?"}</div>
                  <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-700 p-3 text-sm font-semibold text-white">{t("chat.aiSamplePrompt") || "Tôi muốn xem sản phẩm bán chạy."}</div>
                </>
              ) : (
                <div className="max-w-[85%] rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">{t("chat.staffWelcome") || "Chào bạn! Tư vấn viên sẽ kết nối và phản hồi bạn ngay trong giây lát nhé."}</div>
              )}
            </div>
            <div className="border-t border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <input
                  disabled
                  aria-label={t("chat.comingSoon") || "Nhắn tin trực tiếp sắp ra mắt"}
                  className="min-w-0 flex-1 cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-400 outline-none"
                  placeholder={t("chat.comingSoon") || "Nhắn tin trực tiếp sắp ra mắt"}
                />
                <button disabled aria-label={t("chat.send") || "Gửi"} className="cursor-not-allowed rounded-2xl bg-slate-200 p-3 text-slate-400">
                  <Send size={16} />
                </button>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-400">
                {t("chat.comingSoonHint") || "Liên hệ ngay qua Zalo hoặc Messenger bên dưới."}
              </p>
            </div>
          </div>
        )}

        <button onClick={() => setOpen(!open)} className="group flex items-center rounded-full bg-blue-600 p-1.5 text-white opacity-95 shadow-md transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><MessageCircle size={19} /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">{t("chat.btnMain") || "Hỗ trợ trực tuyến"}</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">{t("chat.btnSub") || "Chat AI hoặc Nhân viên"}</span>
          </span>
        </button>

        <a href={ZALO_URL || "#"} onClick={(e) => handleNavigation(e, ZALO_URL, "https://zalo.me/")} target="_blank" rel="noreferrer" className="group flex items-center rounded-full bg-cyan-600 p-1.5 text-white opacity-55 shadow-md transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-lg">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white"><ChatLogoImage src={ZALO_LOGO} alt="Zalo" className="h-full w-full object-cover" /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]"><span className="whitespace-nowrap text-sm font-black">Zalo</span></span>
        </a>

        <a href={FACEBOOK_URL || "#"} onClick={(e) => handleNavigation(e, FACEBOOK_URL, "https://www.facebook.com/")} target="_blank" rel="noreferrer" className="group flex items-center rounded-full bg-indigo-600 p-1.5 text-white opacity-55 shadow-md transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-lg">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white p-1"><ChatLogoImage src={MESSENGER_LOGO} alt="Messenger" className="h-full w-full object-contain" /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]"><span className="whitespace-nowrap text-sm font-black">Facebook</span></span>
        </a>
      </div>

      <div className="flex md:hidden fixed bottom-24 right-4 flex-col items-end gap-3">
        {mobileMenuOpen && (
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-5 duration-250">
            <button
              onClick={() => { setOpen(!open); setMobileMenuOpen(false); }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md border border-blue-500 transition active:scale-95"
            >
              <Bot size={20} />
            </button>

            <a
              href={ZALO_URL || "#"}
              onClick={(e) => { handleNavigation(e, ZALO_URL, "https://zalo.me/"); setMobileMenuOpen(false); }}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-md border border-slate-100 transition active:scale-95"
            >
              <ChatLogoImage src={ZALO_LOGO} alt="Zalo" className="h-full w-full object-cover" />
            </a>

            <a
              href={FACEBOOK_URL || "#"}
              onClick={(e) => { handleNavigation(e, FACEBOOK_URL, "https://www.facebook.com/"); setMobileMenuOpen(false); }}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-md border border-slate-100 p-1 transition active:scale-95"
            >
              <ChatLogoImage src={MESSENGER_LOGO} alt="Messenger" className="h-full w-full object-contain" />
            </a>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (open) setOpen(false); }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 active:scale-95 ${mobileMenuOpen ? "bg-slate-950 rotate-90" : "bg-blue-600"}`}
        >
          {mobileMenuOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {open && (
          <div className="absolute bottom-20 right-0 w-[calc(100vw-32px)] max-w-[320px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="bg-blue-700 px-4 pt-4 pb-2 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-black">{t("chat.title") || "Trung Tâm Hỗ Trợ"}</div>
                  <div className="text-[10px] font-semibold text-white/80">{t("chat.subtitle") || "Tư vấn giải đáp 24/7"}</div>
                </div>
                <button onClick={() => setOpen(false)} aria-label={t("chat.close") || "Đóng"} className="rounded-xl bg-white/10 p-1.5"><X size={14} /></button>
              </div>
              <div className="flex rounded-lg bg-black/20 p-0.5 text-[11px] font-bold">
                <button
                  onClick={() => setChatType("ai")}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 transition-all ${chatType === "ai" ? "bg-white text-blue-700 shadow-sm" : "text-white"}`}
                >
                  <Bot size={12} /> {t("chat.aiTab") || "AI Chatbot"}
                </button>
                <button
                  onClick={() => setChatType("staff")}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1 transition-all ${chatType === "staff" ? "bg-white text-blue-700 shadow-sm" : "text-white"}`}
                >
                  <Users size={12} /> {t("chat.staffTab") || "Nhân viên"}
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 h-[160px] overflow-y-auto">
              {chatType === "ai" ? (
                <>
                  <div className="max-w-[85%] rounded-2xl bg-white p-2.5 text-xs font-semibold text-slate-700 shadow-sm">{t("chat.aiWelcome") || "Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?"}</div>
                  <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-700 p-2.5 text-xs font-semibold text-white">{t("chat.aiSamplePrompt") || "Tôi muốn xem sản phẩm bán chạy."}</div>
                </>
              ) : (
                <div className="max-w-[85%] rounded-2xl bg-white p-2.5 text-xs font-semibold text-slate-700 shadow-sm">{t("chat.staffWelcome") || "Chào bạn! Tư vấn viên sẽ kết nối và phản hồi bạn ngay trong giây lát nhé."}</div>
              )}
            </div>

            <div className="p-2.5 bg-white border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  disabled
                  aria-label={t("chat.comingSoon") || "Nhắn tin trực tiếp sắp ra mắt"}
                  className="min-w-0 flex-1 cursor-not-allowed rounded-xl border bg-slate-100 px-3 py-2 text-xs text-slate-400 outline-none"
                  placeholder={t("chat.comingSoon") || "Nhắn tin trực tiếp sắp ra mắt"}
                />
                <button disabled aria-label={t("chat.send") || "Gửi"} className="cursor-not-allowed rounded-xl bg-slate-200 p-2 text-slate-400">
                  <Send size={12} />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] font-semibold text-slate-400">
                {t("chat.comingSoonHint") || "Liên hệ ngay qua Zalo hoặc Messenger bên dưới."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
