import { useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { AdminSelect, AdminTextField, AdminTextarea, AdminToggle } from "../../components/admin/AdminField";
import { useCms } from "../../store/CmsStore";

const emptyEvent = {
  id: "",
  type: "internal",
  mode: "offline",
  status: "Open Registration",
  title: "",
  date: new Date().toISOString().slice(0, 10),
  time: "14:00 - 17:00",
  location: "",
  address: "",
  organizer: "Gundam Store VN",
  fee: "Miễn phí",
  slots: "24 slots",
  attendees: 0,
  lat: 10.7769,
  lng: 106.7009,
  desc: "",
  agendaText: "",
  cta: "Đăng ký tham gia",
  registerUrl: "",
  livestreamUrl: "",
  active: true,
};

export default function AdminEvents() {
  const { state, actions } = useCms();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyEvent);

  const rows = state.events || [];

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function createEvent() {
    setDraft(emptyEvent);
    setOpen(true);
  }

  function editEvent(event) {
    setDraft({
      ...emptyEvent,
      ...event,
      agendaText: Array.isArray(event.agenda) ? event.agenda.join("\n") : "",
    });
    setOpen(true);
  }

  function saveEvent() {
    actions.saveEvent({
      ...draft,
      attendees: Number(draft.attendees || 0),
      lat: Number(draft.lat || 0),
      lng: Number(draft.lng || 0),
      agenda: String(draft.agendaText || "")
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    });
    setOpen(false);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Community CMS"
        title="Event Management"
        desc="Quản lý workshop, sự kiện bên ngoài, online event, livestream và build contest."
        action={
          <button onClick={createEvent} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white">
            <Plus size={15} className="mr-1 inline" />
            Create event
          </button>
        }
      />

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="group border-t border-slate-100 hover:bg-slate-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                    <button onClick={() => editEvent(event)} className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold">
                      <Edit3 size={14} className="mr-1 inline" />
                      Edit
                    </button>
                    <button onClick={() => actions.deleteEvent(event.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-black">{event.title}</td>
                  <td className="px-4 py-3">{event.type}</td>
                  <td className="px-4 py-3">{event.mode}</td>
                  <td className="px-4 py-3">{event.date}</td>
                  <td className="px-4 py-3">{event.location}</td>
                  <td className="px-4 py-3"><AdminStatusBadge>{event.status}</AdminStatusBadge></td>
                  <td className="px-4 py-3"><AdminStatusBadge>{event.active === false ? "Inactive" : "Active"}</AdminStatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={open} title={draft.id ? "Edit event" : "Create event"} onClose={() => setOpen(false)} onSave={saveEvent} saveLabel="Save event">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Tên sự kiện" tip="Tên hiển thị ngoài trang sự kiện." value={draft.title} onChange={(v) => patch("title", v)} />
            <AdminSelect label="Loại sự kiện" tip="Shop tổ chức hoặc sự kiện bên ngoài." value={draft.type} onChange={(v) => patch("type", v)} options={["internal", "external"]} />
            <AdminSelect label="Hình thức" tip="Offline, online hoặc livestream." value={draft.mode} onChange={(v) => patch("mode", v)} options={["offline", "online", "livestream"]} />
            <AdminSelect label="Trạng thái" value={draft.status} onChange={(v) => patch("status", v)} options={["Open Registration", "Upcoming", "Live Soon", "Sold Out", "Ended"]} />
            <AdminTextField label="Ngày" type="date" value={draft.date} onChange={(v) => patch("date", v)} />
            <AdminTextField label="Giờ" value={draft.time} onChange={(v) => patch("time", v)} />
            <AdminTextField label="Địa điểm" value={draft.location} onChange={(v) => patch("location", v)} />
            <AdminTextField label="Địa chỉ" value={draft.address} onChange={(v) => patch("address", v)} />
            <AdminTextField label="Organizer" value={draft.organizer} onChange={(v) => patch("organizer", v)} />
            <AdminTextField label="Phí tham gia" value={draft.fee} onChange={(v) => patch("fee", v)} />
            <AdminTextField label="Slots" value={draft.slots} onChange={(v) => patch("slots", v)} />
            <AdminTextField label="Attendees" type="number" value={draft.attendees} onChange={(v) => patch("attendees", v)} />
            <AdminTextField label="Latitude" type="number" tip="Dùng cho OpenStreetMap marker." value={draft.lat} onChange={(v) => patch("lat", v)} />
            <AdminTextField label="Longitude" type="number" tip="Dùng cho OpenStreetMap marker." value={draft.lng} onChange={(v) => patch("lng", v)} />
            <AdminTextField label="CTA label" value={draft.cta} onChange={(v) => patch("cta", v)} />
            <AdminToggle label="Active event" checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          </div>

          <AdminTextarea label="Mô tả sự kiện" rows={4} value={draft.desc} onChange={(v) => patch("desc", v)} />
          <AdminTextarea label="Agenda" tip="Mỗi dòng là 1 mục agenda." rows={5} value={draft.agendaText} onChange={(v) => patch("agendaText", v)} />

          <div className="grid gap-4 md:grid-cols-2">
            <AdminTextField label="Register URL" value={draft.registerUrl} onChange={(v) => patch("registerUrl", v)} />
            <AdminTextField label="Livestream URL" value={draft.livestreamUrl} onChange={(v) => patch("livestreamUrl", v)} />
          </div>
        </div>
      </AdminDrawer>
    </>
  );
}
