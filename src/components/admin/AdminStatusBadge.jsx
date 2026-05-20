export default function AdminStatusBadge({ children }) {
  const value = String(children || "").toLowerCase();

  const className =
    value.includes("published") || value.includes("live") || value.includes("active") || value.includes("paid")
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : value.includes("draft") || value.includes("inactive")
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : value.includes("scheduled") || value.includes("processing")
          ? "border-blue-100 bg-blue-50 text-blue-700"
          : value.includes("urgent") || value.includes("high") || value.includes("late")
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-amber-100 bg-amber-50 text-amber-700";

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}
