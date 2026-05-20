export default function AdminTabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-black ${
            active === tab.key
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
