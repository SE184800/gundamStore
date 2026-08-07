import { useState, useMemo } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { AdminSelect, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import { useCms } from "../../store/CmsStore";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";

// 1. 🛠️ ĐÃ SỬA: Thêm status mặc định vào cấu trúc trống ban đầu
const emptyCommunication = { id: "", name: "", platform: "Zalo", value: "", status: "Active", active: true };

// 2. 🛠️ ĐÃ SỬA: Đảm bảo dữ liệu mẫu hệ thống có đầy đủ cả status và active đồng bộ
const defaultCommunications = [
  { id: "1", name: "Zalo hỗ trợ CSKH", platform: "Zalo", value: "https://zalo.me/0935950649", status: "Active", active: true },
  { id: "2", name: "Messenger Fanpage", platform: "Messenger", value: "https://m.me/tri.nguyen.nam.minh", status: "Active", active: true },
  { id: "3", name: "Hotline Tư vấn 24/7", platform: "Hotline", value: "0935950649", status: "Inactive", active: false }
];

export default function AdminCommunication() {
  const { toast, notify, dismiss } = useToast();
  const { state, actions } = useCms();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyCommunication);

  // Tập hợp dữ liệu hiển thị duy nhất từ một nguồn
  const finalRows = useMemo(() => {
    const currentStoreList = state.communications || [];
    
    const baseRows = defaultCommunications.map((defaultComm) => {
      const savedComm = currentStoreList.find((c) => String(c.id) === String(defaultComm.id));
      return savedComm ? savedComm : defaultComm;
    });

    const extraRows = currentStoreList.filter(
      (c) => !defaultCommunications.some((d) => String(d.id) === String(c.id))
    );

    return [...baseRows, ...extraRows];
  }, [state.communications]);

  function patch(field, value) { setDraft((prev) => ({ ...prev, [field]: value })); }
  
  function createCommunication() { 
    setDraft(emptyCommunication); 
    setOpen(true); 
  }
  
  function editCommunication(comm) {
    // 🛠️ ĐÃ SỬA: Đảm bảo lấy đúng status hiện tại của comm, nếu không có thì mặc định là "Active"
    setDraft({ 
      ...emptyCommunication, 
      status: comm.status || "Active", 
      ...comm 
    });
    setOpen(true);
  }

  function saveCommunication() {
    if (!draft.name.trim() || !draft.value.trim()) {
      notify("error", "Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    // 🛠️ ĐÃ SỬA LUỒNG ĐỒNG BỘ 2 CHIỀU CHUẨN:
    // - Nếu status là Inactive -> Ép active = false
    // - Nếu status là Active -> Tự động mở active = true (Sửa lỗi kẹt trạng thái Inactive của bạn)
    const isDeactivated = draft.status === "Inactive" || draft.status === "Maintenance";
    const finalDraft = {
      ...draft,
      active: isDeactivated ? false : true
    };

    if (actions?.saveCommunication) {
      actions.saveCommunication(finalDraft); 
    }
    setOpen(false);
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Customer Service"
        title="Communication Links"
        desc="Quản lý cấu hình đường dẫn kết nối trực tuyến toàn hệ thống."
        action={
          <button onClick={createCommunication} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800 transition-colors">
            <Plus size={15} className="mr-1 inline" /> Add Connection
          </button>
        }
      />

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 w-[200px]">Actions</th>
                <th className="px-4 py-3">Communication Name</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">URL Link</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {finalRows.map((comm) => {
                const isSystemRecord = ["1", "2", "3"].includes(String(comm.id));
                return (
                  <tr key={comm.id} className="group border-t border-slate-100 hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                      <button onClick={() => editCommunication(comm)} className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold hover:bg-slate-100">
                        <Edit3 size={14} className="mr-1 inline" /> Edit
                      </button>
                      {!isSystemRecord && (
                        <button 
                          onClick={() => window.confirm("Xóa liên lạc này?") && actions?.deleteCommunication?.(comm.id)} 
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-950">{comm.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        comm.platform === "Zalo" ? "bg-cyan-50 text-cyan-700" :
                        comm.platform === "Messenger" ? "bg-indigo-50 text-indigo-700" : "bg-emerald-50 text-emerald-700"
                      }`}>{comm.platform}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[350px] truncate">{comm.value}</td>
                    <td className="px-4 py-3">
                      {/* 🛠️ ĐÃ SỬA: Đọc trực tiếp từ trường comm.status để hiển thị chuẩn xác chữ Active/Inactive lên bảng */}
                      <AdminStatusBadge>{comm.status || (comm.active !== false ? "Active" : "Inactive")}</AdminStatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={open} title={draft.id ? "Edit connection" : "Add connection"} onClose={() => setOpen(false)} onSave={saveCommunication} saveLabel="Save">
        <div className="space-y-5">
          <AdminTextField label="Tên kết nối (Label Name)" value={draft.name} onChange={(v) => patch("name", v)} />
          <AdminSelect label="Nền tảng (Platform)" value={draft.platform} onChange={(v) => patch("platform", v)} options={["Zalo", "Messenger", "Hotline"]} />
          <AdminTextField label="Giá trị kết nối (URL / Số điện thoại)" value={draft.value} onChange={(v) => patch("value", v)} />
          <AdminSelect 
            label="Trạng thái hoạt động (Status)" 
            tip="Chỉ định tình trạng vận hành cụ thể của kênh liên lạc này."
            value={draft.status || "Active"} 
            onChange={(v) => patch("status", v)} 
            options={["Active", "Inactive"]} 
          />
          <AdminToggle label="Kích hoạt hiển thị công khai" checked={draft.active !== false} onChange={(v) => patch("active", v)} />
        </div>
      </AdminDrawer>
    </>
  );
}