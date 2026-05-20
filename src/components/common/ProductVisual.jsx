export default function ProductVisual({ tone = "blue", large = false, imageUrl = "" }) {
  const toneMap = {
    blue: "from-blue-900 via-blue-500 to-sky-100",
    cyan: "from-cyan-900 via-cyan-500 to-blue-100",
    sky: "from-sky-800 via-sky-400 to-slate-50",
    red: "from-red-950 via-red-500 to-orange-100",
    gold: "from-amber-800 via-yellow-400 to-slate-50",
    slate: "from-slate-950 via-slate-500 to-slate-100",
    violet: "from-violet-900 via-violet-500 to-blue-100"
  };

  if (imageUrl) {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-slate-100">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${toneMap[tone] || toneMap.blue}`}>
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: large ? "26px 26px" : "18px 18px",
        }}
      />
      <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-white/35 blur-3xl" />
      <div className="absolute bottom-6 left-10 right-10 h-10 rounded-full bg-black/20 blur-xl" />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-[2rem] bg-white/90 shadow-2xl ${large ? "h-72 w-48" : "h-24 w-16"}`}>
        <div className={`absolute left-1/2 -translate-x-1/2 rounded-2xl bg-red-500 ${large ? "top-8 h-16 w-16" : "top-3 h-8 w-8"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 left-7 h-24 w-7" : "bottom-3 left-2 h-10 w-3"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 right-7 h-24 w-7" : "bottom-3 right-2 h-10 w-3"}`} />
        <div className={`absolute -rotate-45 rounded-full bg-yellow-300 ${large ? "-left-24 top-28 h-7 w-40" : "-left-7 top-10 h-3 w-14"}`} />
        <div className={`absolute rotate-45 rounded-full bg-cyan-300 ${large ? "-right-24 top-28 h-7 w-40" : "-right-7 top-10 h-3 w-14"}`} />
      </div>
    </div>
  );
}
