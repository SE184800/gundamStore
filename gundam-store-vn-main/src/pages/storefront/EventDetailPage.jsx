import PageShell from "../../components/common/PageShell";
import { useCms } from "../../store/CmsStore";
import { seedEvents } from "../../data/events";
import { CalendarDays, Clock3, ExternalLink, MapPin, Ticket, Users, Video } from "lucide-react";

function label(event) {
  if (event.mode === "livestream") return "Livestream";
  if (event.mode === "online") return "Online";
  if (event.type === "internal") return "Shop tổ chức";
  return "Bên ngoài";
}

export default function EventDetailPage() {
  const { state } = useCms();
  const id = window.location.pathname.split("/").pop();

  const events = state.events?.length ? state.events : seedEvents;
  const event = events.find((item) => item.id === id) || events[0];

  const agenda = Array.isArray(event.agenda) ? event.agenda : [];

  return (
    <PageShell>
      <main className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <section className="overflow-hidden rounded-[36px] bg-slate-950 p-8 text-white shadow-xl">
          <div className="inline-flex rounded-full bg-blue-700 px-4 py-2 text-xs font-black uppercase tracking-[0.25em]">
            {label(event)}
          </div>

          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-tight">
            {event.title}
          </h1>

          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70">
            {event.desc}
          </p>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Agenda</h2>

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

          <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Thông tin sự kiện</h2>

            <div className="mt-5 space-y-3">
              <Info icon={CalendarDays} label="Ngày" value={event.date} />
              <Info icon={Clock3} label="Thời gian" value={event.time} />
              <Info icon={MapPin} label={event.location} value={event.address} />
              <Info icon={Users} label="Organizer" value={event.organizer} />
              <Info icon={Ticket} label="Tham gia" value={`${event.fee} • ${event.slots} • ${event.status}`} />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={event.registerUrl || event.livestreamUrl || "#"}
                className="rounded-2xl bg-blue-700 px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-100"
              >
                {event.cta || "Đăng ký tham gia"}
              </a>

              <a
                href={`https://www.openstreetmap.org/?mlat=${event.lat}&mlon=${event.lng}#map=14/${event.lat}/${event.lng}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 py-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink size={16} />
                Mở bản đồ
              </a>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
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
