export default function ProductVisual({ tone = "blue", large = false, imageUrl = "" }) {
  const toneMap = {
    blue: "from-blue-800 via-blue-400 to-blue-50",
    cyan: "from-cyan-700 via-cyan-400 to-blue-50",
    sky: "from-sky-700 via-sky-400 to-blue-50",
    red: "from-blue-800 via-blue-400 to-blue-50",
    gold: "from-slate-700 via-slate-400 to-slate-50",
    slate: "from-slate-800 via-slate-400 to-slate-100",
    violet: "from-blue-800 via-blue-400 to-blue-50"
  };

  if (imageUrl) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-slate-100">
        <img src={imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br ${toneMap[tone] || toneMap.blue}`}>
      <div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: large ? "26px 26px" : "18px 18px",
        }}
      />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-8deg] rounded-xl bg-white/90 shadow-md ${large ? "h-72 w-48" : "h-[80%] w-[60%] sm:h-24 sm:w-16"}`}>
        <div className={`absolute left-1/2 -translate-x-1/2 rounded-lg sm:rounded-xl bg-blue-700 ${large ? "top-8 h-16 w-16" : "top-[10%] h-[30%] w-[50%] sm:top-3 sm:h-8 sm:w-8"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 left-7 h-24 w-7" : "bottom-[10%] left-[15%] h-[35%] w-[15%] sm:bottom-3 sm:left-2 sm:h-10 sm:w-3"}`} />
        <div className={`absolute rounded-full bg-slate-900 ${large ? "bottom-8 right-7 h-24 w-7" : "bottom-[10%] right-[15%] h-[35%] w-[15%] sm:bottom-3 sm:right-2 sm:h-10 sm:w-3"}`} />
        <div className={`absolute -rotate-45 rounded-full bg-blue-300 ${large ? "-left-24 top-28 h-7 w-40" : "-left-[30%] top-[40%] h-[10%] w-[80%] sm:-left-7 sm:top-10 sm:h-3 sm:w-14"}`} />
        <div className={`absolute rotate-45 rounded-full bg-cyan-300 ${large ? "-right-24 top-28 h-7 w-40" : "-right-[30%] top-[40%] h-[10%] w-[80%] sm:-right-7 sm:top-10 sm:h-3 sm:w-14"}`} />
      </div>
    </div>
  );
}