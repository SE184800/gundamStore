import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextField, AdminTextarea, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { useCms } from "../../store/CmsStore";
import { makeAdminId } from "./productAdminV4Helpers";

const emptySupplier = {
  id: "",
  name: "",
  country: "Japan",
  contactName: "",
  phone: "",
  email: "",
  website: "",
  note: "",
  active: true,
};

export default function AdminSuppliers() {
  const { state, actions } = useCms();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptySupplier);

  const rows = useMemo(() => {
    return (state.suppliers || []).filter((item) =>
      `${item.name || ""} ${item.country || ""} ${item.phone || ""} ${item.email || ""}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [state.suppliers, query]);

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function openCreate() {
    setDraft(emptySupplier);
    setDrawerOpen(true);
  }

  function openEdit(item) {
    setDraft({ ...emptySupplier, ...item });
    setDrawerOpen(true);
  }

  function save() {
    const payload = { ...draft, id: draft.id || makeAdminId("sup") };
    if (actions.saveSupplier) actions.saveSupplier(payload);
    setDrawerOpen(false);
  }

  function remove(id) {
    if (actions.deleteSupplier) actions.deleteSupplier(id);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Suppliers"
        desc="Quản lý nhà cung cấp, nguồn hàng hoặc đơn vị phân phối. Supplier là thuộc tính của Product Master."
        action={<button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"><Plus size={15} className="mr-1 inline" />Create supplier</button>}
      />

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm theo tên NCC, quốc gia, phone, email..." />
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Supplier name</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="group border-t border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(item)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Edit3 size={14} className="mr-1 inline" />Edit</button>
                      <button onClick={() => remove(item.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-black text-slate-950">{item.name}</td>
                  <td className="px-4 py-3">{item.country || "-"}</td>
                  <td className="px-4 py-3">{item.contactName || "-"}</td>
                  <td className="px-4 py-3">{item.phone || "-"}</td>
                  <td className="px-4 py-3">{item.email || "-"}</td>
                  <td className="px-4 py-3"><AdminStatusBadge>{item.active === false ? "Inactive" : "Active"}</AdminStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit supplier" : "Create supplier"} subtitle="Thông tin nhà cung cấp giúp truy xuất nguồn hàng và phục vụ nhập kho." onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save supplier">
        <div className="grid gap-5 md:grid-cols-2">
          <AdminTextField label="Tên nhà cung cấp" required tip="Tên NCC hoặc đơn vị phân phối." value={draft.name} onChange={(v) => patch("name", v)} />
          <AdminSelect label="Quốc gia" tip="Dùng để phân loại nguồn hàng." value={draft.country} onChange={(v) => patch("country", v)} options={["Japan", "Vietnam", "China", "Hong Kong", "Thailand", "Other"]} />
          <AdminTextField label="Người liên hệ" tip="Tên nhân sự phụ trách bên NCC." value={draft.contactName} onChange={(v) => patch("contactName", v)} />
          <AdminTextField label="Số điện thoại" tip="Số điện thoại liên hệ khi cần đặt hàng hoặc xử lý sự cố." value={draft.phone} onChange={(v) => patch("phone", v)} />
          <AdminTextField label="Email" tip="Email nhận báo giá, PO hoặc thông tin nhập hàng." value={draft.email} onChange={(v) => patch("email", v)} />
          <AdminTextField label="Website / Link" tip="Website hoặc link catalog của NCC." value={draft.website} onChange={(v) => patch("website", v)} />
          <div className="md:col-span-2">
            <AdminTextarea label="Ghi chú vận hành" tip="Ví dụ: lead time, điều kiện đặt hàng, chính sách đổi trả từ NCC." rows={4} value={draft.note} onChange={(v) => patch("note", v)} />
          </div>
          <AdminToggle label="Đang hợp tác" tip="Tắt nếu NCC tạm ngưng hoặc không còn nhập hàng." checked={draft.active !== false} onChange={(v) => patch("active", v)} />
        </div>
      </AdminDrawer>
    </>
  );
}
