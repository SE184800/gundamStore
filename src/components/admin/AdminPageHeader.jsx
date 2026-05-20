export default function AdminPageHeader({ eyebrow, title, desc, action }) {
  return (
    <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          {eyebrow && (
            <div className="mb-1 text-xs font-black uppercase tracking-wide text-blue-700">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          {desc && <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{desc}</p>}
        </div>
        {action}
      </div>
    </section>
  );
}
