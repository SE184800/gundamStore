import { useEffect, useState } from "react";
import PageShell from "../../components/common/PageShell";
import { useLang } from "../../store/CmsStore";
import {
  getPublicEventByIdApi,
  registerEventApi,
} from "../../services/ContentApiService";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Ticket,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

function getCopy(lang) {
  return {
    eventInfo: lang === "en" ? "Event information" : "Thông tin sự kiện",
    register: lang === "en" ? "Register for event" : "Đăng ký tham gia",
    name: lang === "en" ? "Full name" : "Họ tên",
    phone: lang === "en" ? "Phone number" : "Số điện thoại",
    email: lang === "en" ? "Email optional" : "Email nếu có",
    note: lang === "en" ? "Note / build level" : "Ghi chú / trình độ build",
    submit: lang === "en" ? "Submit registration" : "Gửi đăng ký",
    success:
      lang === "en"
        ? "Registration submitted. The shop will confirm soon."
        : "Đã gửi đăng ký. Shop sẽ xác nhận sớm.",
    registered: lang === "en" ? "registered" : "đã đăng ký",
    agenda: lang === "en" ? "Agenda" : "Agenda",
    openMap: lang === "en" ? "Open map" : "Mở bản đồ",
    labelDate: lang === "en" ? "Date" : "Ngày",
    labelTime: lang === "en" ? "Time" : "Thời gian",
    organizer: lang === "en" ? "Organizer" : "Organizer",
    participation: lang === "en" ? "Participation" : "Tham gia",
  };
}

function label(event, lang) {
  if (event.mode === "livestream") return "Livestream";
  if (event.mode === "online") return "Online";
  if (event.type === "internal") return lang === "en" ? "Hosted by shop" : "Shop tổ chức";
  return lang === "en" ? "External event" : "Bên ngoài";
}

function getSlotNumber(slots = "") {
  const match = String(slots || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

export default function EventDetailPage() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const id = window.location.pathname.split("/").pop();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getPublicEventByIdApi(id)
      .then((row) => {
        if (alive) setEvent(row || null);
      })
      .catch((error) => {
        console.error("PUBLIC_EVENT_DETAIL_ERROR", error);
        if (alive) setEvent(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const agenda = Array.isArray(event?.agenda) ? event.agenda : [];
  const registeredCount = Number(event?.attendees || 0);
  const slotNumber = getSlotNumber(event?.slots);
  const availableSlots = slotNumber
    ? Math.max(0, slotNumber - registeredCount)
    : null;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function patch(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitRegistration(eventSubmit) {
    eventSubmit.preventDefault();
    setError("");
    setMessage("");

    try {
      await registerEventApi(event.id, form);
      setMessage(t.success);
      setForm({ name: "", phone: "", email: "", note: "" });
      setEvent((current) =>
        current
          ? {
              ...current,
              attendees: Number(current.attendees || 0) + 1,
            }
          : current
      );
    } catch (err) {
      setError(err?.message || "Registration failed.");
    }
  }

  if (!event) {
    return (
      <PageShell>
        <main className="mx-auto max-w-[1200px] px-4 py-16 text-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 font-bold text-slate-500">
            {loading ? "Đang tải sự kiện..." : "Không tìm thấy sự kiện."}
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <section className="overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-xl">
          <div className="inline-flex rounded-full bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
            {label(event, lang)}
          </div>

          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight">
            {event.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
            {event.desc}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MiniStat label={t.registered} value={registeredCount} />
            <MiniStat label={lang === "en" ? "Slots left" : "Còn slot"} value={availableSlots ?? "Public"} />
            <MiniStat label="Status" value={event.status || "-"} />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">{t.agenda}</h2>

              <div className="mt-5 space-y-3">
                {agenda.map((item, index) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs font-black text-blue-700">#{index + 1}</div>
                    <div className="mt-1 text-sm font-black text-slate-800">{item}</div>
                  </div>
                ))}
              </div>

              {event.mode === "livestream" && (
                <div className="mt-6 overflow-hidden rounded-2xl bg-slate-950 text-white">
                  <div className="flex aspect-video items-center justify-center">
                    <div className="text-center">
                      <Video className="mx-auto mb-3 text-purple-400" size={36} />
                      <div className="text-lg font-black">Livestream Embed Preview</div>
                      <div className="mt-1 text-xs font-semibold text-white/60">
                        Sau này nhúng YouTube/Facebook Live tại đây
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={submitRegistration} className="rounded-[30px] border border-blue-100 bg-blue-50 p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-2xl font-black text-slate-950">
                <UserPlus size={24} className="text-blue-700" />
                {t.register}
              </h2>

              {message && (
                <div className="mt-4 rounded-2xl bg-green-50 p-4 text-sm font-black text-green-700">
                  <CheckCircle2 size={17} className="mr-1 inline" />
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(eventInput) => patch("name", eventInput.target.value)}
                  placeholder={t.name}
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
                <input
                  value={form.phone}
                  onChange={(eventInput) => patch("phone", eventInput.target.value)}
                  placeholder={t.phone}
                  inputMode="tel"
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
                />
                <input
                  value={form.email}
                  onChange={(eventInput) => patch("email", eventInput.target.value)}
                  placeholder={t.email}
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 md:col-span-2"
                />
                <textarea
                  value={form.note}
                  onChange={(eventInput) => patch("note", eventInput.target.value)}
                  placeholder={t.note}
                  rows={4}
                  className="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 md:col-span-2"
                />
              </div>

              <button
                type="submit"
                className="mt-5 rounded-2xl bg-blue-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-100"
              >
                {t.submit}
              </button>
            </form>
          </div>

          <aside className="h-fit rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-2xl font-black text-slate-950">{t.eventInfo}</h2>

            <div className="mt-5 space-y-3">
              <Info icon={CalendarDays} label={t.labelDate} value={event.date} />
              <Info icon={Clock3} label={t.labelTime} value={event.time} />
              <Info icon={MapPin} label={event.location} value={event.address} />
              <Info icon={Users} label={t.organizer} value={event.organizer} />
              <Info icon={Ticket} label={t.participation} value={`${event.fee} • ${event.slots} • ${event.status}`} />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`https://www.openstreetmap.org/?mlat=${event.lat}&mlon=${event.lng}#map=14/${event.lat}/${event.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink size={16} />
                {t.openMap}
              </a>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="text-xs font-black uppercase tracking-widest text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-400">
        <Icon size={15} />
        {label}
      </div>
      <div className="mt-1 text-sm font-black text-slate-800">{value}</div>
    </div>
  );
}
