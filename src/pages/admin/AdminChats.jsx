import { Send } from "lucide-react";
import { useState } from "react";
import { useCms, useLang } from "../../store/CmsStore";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

const text = {
  vi: { title: "Trung tâm CSKH / Chat", desc: "Tin nhắn từ chatbox storefront sẽ xuất hiện tại đây.", reply: "Nhập phản hồi...", send: "Gửi" },
  en: { title: "Support / Chat Center", desc: "Messages from storefront chatbox appear here.", reply: "Type reply...", send: "Send" }
};

export default function AdminChats() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];
  const [selected, setSelected] = useState(state.chats[0]?.id || "");
  const [reply, setReply] = useState("");
  const chat = state.chats.find((c) => c.id === selected) || state.chats[0];

  function send() {
    if (!reply.trim() || !chat) return;
    actions.replyChat(chat.id, reply.trim(), "staff");
    setReply("");
  }

  return (
    <>
      <AdminPageHeader title={t.title} desc={t.desc} />
      <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            {state.chats.map((c) => (
              <button key={c.id} onClick={() => setSelected(c.id)} className={`w-full rounded-2xl p-4 text-left ${selected === c.id ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                <div className="font-black">{c.customer}</div>
                <div className="mt-1 line-clamp-1 text-xs font-semibold opacity-80">{c.messages[c.messages.length - 1]?.text}</div>
                <div className="mt-2 text-[10px] font-black opacity-70">{c.updatedAt}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {chat ? (
            <>
              <div className="border-b border-slate-100 p-4"><div className="font-black text-slate-950">{chat.customer}</div><div className="text-xs font-semibold text-slate-500">{chat.status} • {chat.assignedTo}</div></div>
              <div className="h-[520px] space-y-3 overflow-y-auto bg-slate-50 p-5">
                {chat.messages.map((m, i) => <div key={i} className={`flex ${m.from === "customer" ? "justify-start" : "justify-end"}`}><div className={`max-w-[75%] rounded-2xl p-3 text-sm font-semibold leading-6 ${m.from === "customer" ? "bg-white text-slate-700 shadow-sm" : "bg-blue-700 text-white"}`}>{m.text}<div className={`mt-1 text-[10px] ${m.from === "customer" ? "text-slate-400" : "text-white/70"}`}>{m.from} • {m.time}</div></div></div>)}
              </div>
              <div className="flex gap-2 border-t border-slate-100 p-4"><input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none" placeholder={t.reply} /><button onClick={send} className="rounded-2xl bg-blue-700 px-5 text-white hover:bg-blue-800"><Send size={18}/></button></div>
            </>
          ) : <div className="p-10 text-center font-black text-slate-500">No chats</div>}
        </div>
      </section>
    </>
  );
}
