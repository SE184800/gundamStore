import { useEffect, useMemo, useState } from "react";
import { Download, Edit3, Plus, Trash2, Users } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import { AdminSelect, AdminTextField, AdminTextarea, AdminToggle } from "../../components/admin/AdminField";
import {
  deleteAdminEventApi,
  getAdminEventsApi,
  saveAdminEventApi,
  updateAdminEventRegistrationApi,
} from "../../services/ContentApiService";

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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(emptyEvent);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [rows, setRows] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [error, setError] = useState("");

  async function reload() {
    try {
      const data = await getAdminEventsApi();
      setRows(data.events);
      setAllRegistrations(data.registrations);
      setError("");
    } catch (loadError) {
      setError(loadError?.message || "Cannot load events.");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const registrationSummary = useMemo(
    () => ({
      total: allRegistrations.length,
      pending: allRegistrations.filter(
        (item) =>
          String(item.status).toUpperCase() === "PENDING"
      ).length,
      confirmed: allRegistrations.filter(
        (item) =>
          String(item.status).toUpperCase() === "CONFIRMED"
      ).length,
      cancelled: allRegistrations.filter(
        (item) =>
          String(item.status).toUpperCase() === "CANCELLED"
      ).length,
    }),
    [allRegistrations]
  );

  const registrations = useMemo(() => {
    if (selectedEventId === "all") {
      return allRegistrations;
    }

    return allRegistrations.filter(
      (item) => item.eventId === selectedEventId
    );
  }, [selectedEventId, allRegistrations]);

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


  async function updateRegistration(id, status) {
    try {
      await updateAdminEventRegistrationApi(
        id,
        status.toUpperCase()
      );
      await reload();
    } catch (updateError) {
      setError(
        updateError?.message ||
          "Cannot update registration."
      );
    }
  }

  function exportRegistrations() {
    const rowsForExport = [
      ["Registration ID", "Event", "Name", "Phone", "Email", "Status", "Created At"],
      ...registrations.map((item) => [
        item.id,
        item.eventTitle,
        item.name,
        item.phone,
        item.email,
        item.status,
        item.createdAt,
      ]),
    ];

    const csv = rowsForExport
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "event-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveEvent() {
    try {
      await saveAdminEventApi({
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
      await reload();
    } catch (saveError) {
      setError(saveError?.message || "Cannot save event.");
    }
  }

  async function deleteEvent(id) {
    if (!window.confirm("Xóa sự kiện này?")) return;

    try {
      await deleteAdminEventApi(id);
      await reload();
    } catch (deleteError) {
      setError(
        deleteError?.message || "Cannot delete event."
      );
    }
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

      {error && (
        <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </section>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase text-slate-400">Registrations</div>
          <div className="mt-2 text-3xl font-black text-blue-700">{registrationSummary.total}</div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase text-slate-400">Pending</div>
          <div className="mt-2 text-3xl font-black text-amber-600">{registrationSummary.pending}</div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase text-slate-400">Confirmed</div>
          <div className="mt-2 text-3xl font-black text-green-600">{registrationSummary.confirmed}</div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="text-xs font-black uppercase text-slate-400">Cancelled</div>
          <div className="mt-2 text-3xl font-black text-red-600">{registrationSummary.cancelled}</div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-slate-950">
              <Users size={18} className="text-blue-700" />
              Event registrations
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Demo localStorage registrations from customer event detail page.
            </p>
          </div>

          <button onClick={exportRegistrations} className="rounded-2xl border px-4 py-2 text-xs font-black hover:bg-slate-50">
            <Download size={15} className="mr-1 inline" />
            Export CSV
          </button>
        </div>

        <div className="mb-4">
          <select
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none"
          >
            <option value="all">All events</option>
            {rows.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center font-bold text-slate-400">
                    No registrations yet.
                  </td>
                </tr>
              ) : (
                registrations.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3 font-bold">{item.eventTitle}</td>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.phone}</td>
                    <td className="px-4 py-3">{item.email || "-"}</td>
                    <td className="px-4 py-3">{item.note || "-"}</td>
                    <td className="px-4 py-3"><AdminStatusBadge>{item.status}</AdminStatusBadge></td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateRegistration(item.id, "Confirmed")} className="mr-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-green-700">
                        Confirm
                      </button>
                      <button onClick={() => updateRegistration(item.id, "Cancelled")} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

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
                    <button onClick={() => void deleteEvent(event.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
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
