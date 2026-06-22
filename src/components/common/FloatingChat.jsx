import { useState, useMemo, useRef, useEffect } from "react";
import { Bot, MessageCircle, Users, X, Send } from "lucide-react";
import { useCms } from "../../store/CmsStore";
import { useI18n } from "../../i18n";

const defaultCommunications = [
  { id: "1", name: "Zalo hỗ trợ CSKH", platform: "Zalo", value: "https://zalo.me/0931817801", status: "Active", active: true },
  { id: "2", name: "Messenger Fanpage", platform: "Messenger", value: "https://m.me/tri.nguyen.nam.minh", status: "Active", active: true },
  { id: "3", name: "Hotline Tư vấn 24/7", platform: "Hotline", value: "0931817801", status: "Maintenance", active: false }
];

const ZALO_LOGO = import.meta.env.VITE_ZALO_LOGO;
const MESSENGER_LOGO = import.meta.env.VITE_MESSENGER_LOGO;

export default function FloatingChat() {
  const { state } = useCms();
  const [open, setOpen] = useState(false);         // Control hộp thoại Chat Box (Cả 2 giao diện)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Control bung 3 nút trên Mobile
  const [chatType, setChatType] = useState("ai");
  const { t } = useI18n();
  const chatRef = useRef(null);

  // Tự động đóng các menu khi nhấn ra ngoài vùng trống
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
      alert(t("chat.notAvailable") || "Đường link đang bảo trì hoặc không khả dụng. Vui lòng quay lại sau!");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div ref={chatRef} className="fixed bottom-0 right-0 z-[9999]">

      {/* ============================================================================== */}
      {/* 🖥️ GIAO DIỆN DESKTOP (md: trở lên): HIỂN THỊ 3 NÚT NẰM LỘ THIÊN TRƯỢT NGANG NHƯ CŨ */}
      {/* ============================================================================== */}
      <div className="hidden md:flex fixed bottom-5 right-5 flex-col items-end gap-2">
        {/* Hộp thoại Chat Box của Desktop */}
        {open && (
          <div className="absolute bottom-[230px] right-0 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="bg-blue-700 px-4 pt-3 pb-2 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-black">{t("chat.title") || "Trung Tâm Hỗ Trợ"}</div>
                  <div className="text-xs font-semibold text-white/80">{t("chat.subtitle") || "Tư vấn giải đáp 24/7"}</div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors"><X size={16} /></button>
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
            <div className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder={chatType === "ai" ? t("chat.aiPlaceholder") : t("chat.staffPlaceholder")} />
              <button className="rounded-2xl bg-blue-700 p-3 text-white hover:bg-blue-800 transition-colors"><Send size={16} /></button>
            </div>
          </div>
        )}

        {/* 3 Nút độc lập của Desktop */}
        <button onClick={() => setOpen(!open)} className="group flex items-center rounded-full bg-blue-600 p-2 text-white opacity-95 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20"><MessageCircle size={22} /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">{t("chat.btnMain") || "Hỗ trợ trực tuyến"}</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">{t("chat.btnSub") || "Chat AI hoặc Nhân viên"}</span>
          </span>
        </button>

        <a href={ZALO_URL || "#"} onClick={(e) => handleNavigation(e, ZALO_URL, "https://zalo.me/")} target="_blank" rel="noreferrer" className="group flex items-center rounded-full bg-cyan-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white"><img src={ZALO_LOGO} alt="Zalo" className="h-full w-full object-cover" /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]"><span className="whitespace-nowrap text-sm font-black">Zalo</span></span>
        </a>

        <a href={FACEBOOK_URL || "#"} onClick={(e) => handleNavigation(e, FACEBOOK_URL, "https://www.facebook.com/")} target="_blank" rel="noreferrer" className="group flex items-center rounded-full bg-indigo-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl">
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-1"><img src={MESSENGER_LOGO} alt="Messenger" className="h-full w-full object-contain" /></span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]"><span className="whitespace-nowrap text-sm font-black">Facebook</span></span>
        </a>
      </div>

      {/* ============================================================================== */}
      {/* 📱 GIAO DIỆN MOBILE (md:hidden): CHỈ 1 NÚT, BẤM PHÁT BUNG 3 NÚT XẾP CHỒNG LÊN TRÊN */}
      {/* ============================================================================== */}
      <div className="flex md:hidden fixed bottom-24 right-4 flex-col items-end gap-3">

        {/* DANH SÁCH 3 NÚT NỔI XẾP CHỒNG (Chỉ lộ diện khi bấm nút chính ở dưới) */}
        {mobileMenuOpen && (
          <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-5 duration-250">

            {/* Nút Phụ 1: Bật/mở Hộp thoại Chat Box đồng bộ bản Web */}
            <button
              onClick={() => { setOpen(!open); setMobileMenuOpen(false); }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl border border-blue-500 transition active:scale-95"
            >
              <Bot size={20} />
            </button>

            {/* Nút Phụ 2: Link Zalo chính hãng */}
            <a
              href={ZALO_URL || "#"}
              onClick={(e) => { handleNavigation(e, ZALO_URL, "https://zalo.me/"); setMobileMenuOpen(false); }}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-xl border border-slate-100 transition active:scale-95"
            >
              <img src={ZALO_LOGO} alt="Zalo" className="h-full w-full object-cover" />
            </a>

            {/* Nút Phụ 3: Link Messenger Fanpage */}
            <a
              href={FACEBOOK_URL || "#"}
              onClick={(e) => { handleNavigation(e, FACEBOOK_URL, "https://www.facebook.com/"); setMobileMenuOpen(false); }}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white shadow-xl border border-slate-100 p-1 transition active:scale-95"
            >
              <img src={MESSENGER_LOGO} alt="Messenger" className="h-full w-full object-contain" />
            </a>

          </div>
        )}

        {/* NÚT KÍCH HOẠT CHÍNH TRÊN MOBILE */}
        <button
          type="button"
          onClick={() => { setMobileMenuOpen(!mobileMenuOpen); if (open) setOpen(false); }}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 active:scale-95 ${mobileMenuOpen ? "bg-slate-950 rotate-90" : "bg-blue-600"}`}
        >
          {mobileMenuOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {/* 🟢 HỘP CHAT POPUP CHO MOBILE: ĐÃ ĐỒNG BỘ 100% TÍNH NĂNG 2 TAB NHƯ BẢN DESKTOP */}
        {open && (
          <div className="absolute bottom-20 right-0 w-[calc(100vw-32px)] max-w-[320px] overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">

            {/* Header Hộp thoại Mobile */}
            <div className="bg-blue-700 px-4 pt-4 pb-2 text-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs font-black">{t("chat.title") || "Trung Tâm Hỗ Trợ"}</div>
                  <div className="text-[10px] font-semibold text-white/80">{t("chat.subtitle") || "Tư vấn giải đáp 24/7"}</div>
                </div>
                <button onClick={() => setOpen(false)} className="rounded-xl bg-white/10 p-1.5"><X size={14} /></button>
              </div>

              {/* Thanh Chuyển Đổi Tab Kép Trên Mobile */}
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

            {/* Vùng Tin Nhắn Nội Dung Phụ Thuộc Vào Tab Đang Chọn */}
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

            {/* Khung Nhập Liệu Cuối Hộp Thoại */}
            <div className="flex items-center gap-2 p-2.5 bg-white border-t border-slate-100">
              <input className="min-w-0 flex-1 rounded-xl border bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-400 focus:bg-white transition" placeholder={chatType === "ai" ? t("chat.aiPlaceholder") : t("chat.staffPlaceholder")} />
              <button className="rounded-xl bg-blue-700 p-2 text-white hover:bg-blue-800 transition"><Send size={12} /></button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}