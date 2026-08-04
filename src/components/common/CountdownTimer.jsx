import { useEffect, useState } from "react";

function getRemainingMs(endDate) {
  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, end - Date.now());
}

function splitDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

export default function CountdownTimer({ endDate, className = "" }) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(endDate));

  useEffect(() => {
    setRemaining(getRemainingMs(endDate));
    const timer = setInterval(() => setRemaining(getRemainingMs(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate || remaining <= 0) return null;

  const { days, hours, minutes, seconds } = splitDuration(remaining);

  return (
    <div className={`flex items-center gap-1 font-black tabular-nums ${className}`}>
      {days > 0 && <span className="mr-0.5">{days}d</span>}
      <span className="rounded bg-slate-950 px-1.5 py-0.5 text-white">{pad(hours)}</span>
      <span>:</span>
      <span className="rounded bg-slate-950 px-1.5 py-0.5 text-white">{pad(minutes)}</span>
      <span>:</span>
      <span className="rounded bg-slate-950 px-1.5 py-0.5 text-white">{pad(seconds)}</span>
    </div>
  );
}
