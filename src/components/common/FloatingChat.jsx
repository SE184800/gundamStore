import { useState, useMemo } from "react";
import { Bot, MessageCircle, Users, X, Send } from "lucide-react";
import { useCms } from "../../store/CmsStore";

// 1. 🛠️ ĐÃ SỬA: Bổ sung trường status mặc định để đồng bộ logic với bảng Admin
const defaultCommunications = [
  { id: "1", name: "Zalo hỗ trợ CSKH", platform: "Zalo", value: "https://zalo.me/0931817801", status: "Active", active: true },
  { id: "2", name: "Messenger Fanpage", platform: "Messenger", value: "https://m.me/tri.nguyen.nam.minh", status: "Active", active: true },
  { id: "3", name: "Hotline Tư vấn 24/7", platform: "Hotline", value: "0931817801", status: "Maintenance", active: false }
];

const ZALO_LOGO = import.meta.env.VITE_ZALO_LOGO;
const MESSENGER_LOGO = import.meta.env.VITE_MESSENGER_LOGO;

export default function FloatingChat() {
  const { state } = useCms();
  const [open, setOpen] = useState(false);
  const [chatType, setChatType] = useState("ai");

  // Gom toàn bộ mảng dữ liệu cấu hình thực tế
  const allCommunications = useMemo(() => {
    const currentStoreList = state.communications || [];
    const baseRows = defaultCommunications.map(d => currentStoreList.find(c => String(c.id) === String(d.id)) || d);
    const extraRows = currentStoreList.filter(c => !defaultCommunications.some(d => String(d.id) === String(c.id)));
    return [...baseRows, ...extraRows];
  }, [state.communications]);

  // Hàm kiểm tra một kênh có sẵn sàng hoạt động hay không (Đọc an toàn hơn)
  const isAvailable = (c) => {
    if (c.active === false) return false;
    const currentStatus = String(c.status || "Active").toLowerCase();
    if (currentStatus === "inactive" || currentStatus === "maintenance") return false;
    return true;
  };

  // 🛠️ ĐƯỜNG DẪN DÒ ĐỘNG THEO TRẠNG THÁI ACTIVE
  const ZALO_URL = useMemo(() => {
    // Ưu tiên 1: Kiểm tra Zalo chính (ID "1")
    const primaryZalo = allCommunications.find(c => String(c.id) === "1" && c.platform === "Zalo" && isAvailable(c));
    if (primaryZalo) return primaryZalo.value;

    // Ưu tiên 2: Nếu kênh chính bảo trì, tìm kênh phụ (Zalo chi nhánh 2) thỏa mãn điều kiện sẵn sàng
    const backupZalo = allCommunications.find(c => c.platform === "Zalo" && isAvailable(c));
    return backupZalo ? backupZalo.value : "";
  }, [allCommunications]);

  // 2. Lấy link Messenger khả dụng
  const FACEBOOK_URL = useMemo(() => {
    const primaryFB = allCommunications.find(c => String(c.id) === "2" && c.platform === "Messenger" && isAvailable(c));
    if (primaryFB) return primaryFB.value;

    const backupFB = allCommunications.find(c => c.platform === "Messenger" && isAvailable(c));
    return backupFB ? backupFB.value : "";
  }, [allCommunications]);

  // 🛠️ HÀM KIỂM TRA ĐIỀU KIỆN ĐƯỜNG DẪN TRƯỚC KHI CHO ĐIỀU HƯỚNG
  const handleNavigation = (e, url, defaultPrefix) => {
    e.preventDefault(); // Chặn trình duyệt chuyển hướng bậy bạ khi link lỗi
    
    // Nếu không có link, hoặc link bị xóa trống, hoặc chỉ chứa prefix mặc định -> Chặn và báo lỗi
    if (!url || url.trim() === "" || url === defaultPrefix) {
      alert("Đường link đang bảo trì hoặc không khả dụng. Vui lòng quay lại sau!");
      return;
    }
    
    // Nếu hợp lệ, mở tab mới an toàn
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Khối hiển thị Hộp thoại Chat gộp */}
      {open && (
        <div className="fixed bottom-[250px] right-5 z-50 w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-200">
          <div className="bg-blue-700 px-4 pt-3 pb-2 text-white">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-black">Trung Tâm Hỗ Trợ</div>
                <div className="text-xs font-semibold text-white/80">Tư vấn giải đáp 24/7</div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="flex rounded-xl bg-black/20 p-1 text-xs font-bold">
              <button
                onClick={() => setChatType("ai")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                  chatType === "ai" ? "bg-white text-blue-700 shadow-sm" : "text-white hover:bg-white/10"
                }`}
              >
                <Bot size={14} /> AI Chatbot
              </button>
              <button
                onClick={() => setChatType("staff")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                  chatType === "staff" ? "bg-white text-blue-700 shadow-sm" : "text-white hover:bg-white/10"
                }`}
              >
                <Users size={14} /> Nhân viên
              </button>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 p-4 min-h-[140px] max-h-[250px] overflow-y-auto">
            {chatType === "ai" ? (
              <>
                <div className="max-w-[85%] rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
                  Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl bg-blue-700 p-3 text-sm font-semibold text-white">
                  Tôi muốn xem sản phẩm bán chạy.
                </div>
              </>
            ) : (
              <div className="max-w-[85%] rounded-2xl bg-white p-3 text-sm font-semibold text-slate-700 shadow-sm">
                Chào bạn! Tư vấn viên sẽ kết nối và phản hồi bạn ngay trong giây lát nhé.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 p-3">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder={chatType === "ai" ? "Nhập tin nhắn hỏi AI..." : "Nhắn tin đến nhân viên..."}
            />
            <button className="rounded-2xl bg-blue-700 p-3 text-white hover:bg-blue-800 transition-colors">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Cụm nút nổi */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="group flex items-center rounded-full bg-blue-600 p-2 text-white opacity-95 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <MessageCircle size={22} />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">Hỗ trợ trực tuyến</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Chat AI hoặc Nhân viên</span>
          </span>
        </button>

        {/* Nút Zalo */}
        <a
          href={ZALO_URL || "#"}
          onClick={(e) => handleNavigation(e, ZALO_URL, "https://zalo.me/")}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center rounded-full bg-cyan-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src={ZALO_LOGO} alt="Zalo" className="h-full w-full object-cover" />
          </span>
          <span className="grid max-w-0 overflow-hidden text-left transition-all duration-300 group-hover:ml-3 group-hover:max-w-[210px]">
            <span className="whitespace-nowrap text-sm font-black">Zalo</span>
            <span className="whitespace-nowrap text-[11px] font-semibold text-white/80">Mở Zalo shop</span>
          </span>
        </a>

        {/* Nút Facebook */}
        <a
          href={FACEBOOK_URL || "#"}
          onClick={(e) => handleNavigation(e, FACEBOOK_URL, "https://www.facebook.com/上网")}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center rounded-full bg-indigo-600 p-2 text-white opacity-55 shadow-xl transition-all duration-300 hover:rounded-2xl hover:opacity-100 hover:shadow-2xl"
        >
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-1">
            <img src={MESSENGER_LOGO} alt="Messenger" className="h-full w-full object-contain" />
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