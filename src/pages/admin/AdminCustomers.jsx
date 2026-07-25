import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquarePlus, RefreshCcw, Search, UserRound, WalletCards } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import { AdminSelect, AdminTextarea, AdminTextField, AdminToggle } from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatCurrency } from "../../utils/format";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";
import {
  createAdminCustomerNoteApi,
  getAdminCustomerDetailApi,
  getAdminCustomersApi,
  updateAdminCustomerProfileApi,
} from "../../services/AdminCustomerApiService";

const TYPE_OPTIONS = [
  { value: "ALL", label: "All customers" },
  { value: "REGISTERED", label: "Registered" },
  { value: "GUEST", label: "Guest checkout" },
];

const SEGMENT_OPTIONS = [
  { value: "ALL", label: "All segments" },
  { value: "High value", label: "High value" },
  { value: "Repeat buyer", label: "Repeat buyer" },
  { value: "First-time buyer", label: "First-time buyer" },
  { value: "At risk", label: "At risk" },
  { value: "Lead", label: "Lead" },
  { value: "VIP", label: "VIP" },
  { value: "Loyal", label: "Loyal" },
];

const NOTE_TYPE_OPTIONS = [
  { value: "NOTE", label: "General note" },
  { value: "CALL", label: "Call log" },
  { value: "FOLLOW_UP", label: "Follow up" },
  { value: "COMPLAINT", label: "Complaint" },
  { value: "VIP", label: "VIP care" },
];

function customerStatusClass(customer = {}) {
  if (customer.segment === "High value" || customer.tier === "VIP") return "bg-violet-50 text-violet-700";
  if (customer.segment === "At risk") return "bg-red-50 text-red-700";
  if (customer.segment === "Repeat buyer") return "bg-emerald-50 text-emerald-700";
  return "bg-blue-50 text-blue-700";
}

function shortDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
}

export default function AdminCustomers() {
  const { toast, notify, dismiss } = useToast();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [segment, setSegment] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState({ type: "NOTE", content: "" });
  const [profileDraft, setProfileDraft] = useState(null);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const data = await getAdminCustomersApi({ q: query, type, segment });
      setCustomers(data.customers);
      setSummary(data.summary || null);
    } catch (error) {
      setApiError(error?.message || "Cannot load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, segment]);

  const localSummary = useMemo(() => {
    return {
      total: customers.length,
      registered: customers.filter((item) => item.type === "REGISTERED").length,
      guest: customers.filter((item) => item.type === "GUEST").length,
      highValue: customers.filter((item) => item.segment === "High value" || item.tier === "VIP").length,
      atRisk: customers.filter((item) => item.segment === "At risk").length,
      totalSpent: customers.reduce((sum, item) => sum + Number(item.totalSpent || 0), 0),
      ...(summary || {}),
    };
  }, [customers, summary]);

  async function openDetail(customer) {
    setDrawerOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setNoteDraft({ type: "NOTE", content: "" });

    try {
      const item = await getAdminCustomerDetailApi(customer.customerKey);
      setDetail(item);
      setProfileDraft({
        name: item.name || "",
        phone: item.phone || "",
        city: item.city || "",
        address: item.address || "",
        note: item.note || "",
        active: item.active !== false,
      });
    } catch (error) {
      notify("error", error?.message || "Cannot load customer detail.");
      setDrawerOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function addNote() {
    if (!detail?.customerKey || !noteDraft.content.trim()) return;

    try {
      await createAdminCustomerNoteApi({
        customerId: detail.type === "REGISTERED" ? detail.id : "",
        customerKey: detail.customerKey,
        type: noteDraft.type,
        content: noteDraft.content,
      });

      const item = await getAdminCustomerDetailApi(detail.customerKey);
      setDetail(item);
      setNoteDraft({ type: "NOTE", content: "" });
      await reload();
    } catch (error) {
      notify("error", error?.message || "Cannot add note.");
    }
  }

  async function saveProfile() {
    if (!detail?.id || detail.type !== "REGISTERED") return;

    try {
      await updateAdminCustomerProfileApi(detail.id, profileDraft);
      const item = await getAdminCustomerDetailApi(detail.customerKey);
      setDetail(item);
      await reload();
      notify("success", "Customer profile updated.");
    } catch (error) {
      notify("error", error?.message || "Cannot update customer.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      <AdminPageHeader
        eyebrow="Customer operations"
        title="Customer / CRM Center"
        desc="View registered and guest customers, purchase history, customer value, segmentation and care notes."
        action={
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        }
      />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
          {apiError}
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Customers</p><p className="mt-2 text-2xl font-black">{localSummary.total}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Registered</p><p className="mt-2 text-2xl font-black text-blue-600">{localSummary.registered}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Guest</p><p className="mt-2 text-2xl font-black text-slate-600">{localSummary.guest}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">High value</p><p className="mt-2 text-2xl font-black text-violet-600">{localSummary.highValue}</p></div>
        <div className="rounded-3xl bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-400">Revenue</p><p className="mt-2 text-xl font-black text-emerald-600">{formatCurrency(localSummary.totalSpent)}</p></div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[220px_220px_1fr_auto]">
          <AdminSelect label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          <AdminSelect label="Segment" options={SEGMENT_OPTIONS} value={segment} onChange={setSegment} />
          <div className="flex items-center self-end rounded-md border border-slate-300 bg-white px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, email, segment..."
              className="w-full bg-transparent px-3 py-3 text-sm font-semibold outline-none"
            />
          </div>
          <button onClick={() => void reload()} className="self-end rounded-md bg-slate-900 px-4 py-3 text-xs font-black text-white hover:bg-slate-800">
            Search
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Segment</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">AOV</th>
                <th className="px-4 py-3">Last order</th>
                <th className="px-4 py-3">Care notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customerKey} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <div className="font-black text-slate-950">{customer.name}</div>
                        <div className="text-xs font-bold text-slate-500">{customer.phone || "-"} · {customer.email || "-"}</div>
                        <div className="mt-1 text-[11px] font-black uppercase text-slate-400">{customer.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${customerStatusClass(customer)}`}>
                      {customer.segment}
                    </span>
                    <div className="mt-1 text-xs font-black text-slate-500">{customer.tier}</div>
                  </td>
                  <td className="px-4 py-3 font-black">{customer.totalOrders}</td>
                  <td className="px-4 py-3 font-black text-emerald-600">{formatCurrency(customer.totalSpent)}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(customer.avgOrderValue)}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-600">
                    {shortDate(customer.lastOrderAt)}
                    {customer.daysSinceLastOrder !== null && customer.daysSinceLastOrder !== undefined ? (
                      <div className="mt-1 text-slate-400">{customer.daysSinceLastOrder} day(s)</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                      {customer.noteCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => void openDetail(customer)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-100">
                      <Eye size={14} className="mr-1 inline" />
                      View CRM
                    </button>
                  </td>
                </tr>
              ))}

              {!customers.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                    {loading ? "Loading customers..." : "No customers found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title="Customer CRM Detail"
        onClose={() => setDrawerOpen(false)}
        onSave={detail?.type === "REGISTERED" ? () => void saveProfile() : undefined}
        saveLabel="Save profile"
        width="max-w-5xl"
      >
        {detailLoading && <div className="rounded-2xl bg-slate-50 p-6 text-sm font-black text-slate-500">Loading...</div>}

        {detail && (
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl bg-blue-50 p-4">
                <div className="text-xs font-black uppercase text-blue-600">Customer</div>
                <div className="mt-2 text-xl font-black text-slate-950">{detail.name}</div>
                <div className="mt-1 text-xs font-bold text-slate-500">{detail.type}</div>
              </div>
              <div className="rounded-3xl bg-emerald-50 p-4">
                <div className="text-xs font-black uppercase text-emerald-600">Total spent</div>
                <div className="mt-2 text-xl font-black text-emerald-700">{formatCurrency(detail.totalSpent)}</div>
              </div>
              <div className="rounded-3xl bg-violet-50 p-4">
                <div className="text-xs font-black uppercase text-violet-600">Segment</div>
                <div className="mt-2 text-xl font-black text-violet-700">{detail.segment}</div>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="text-xs font-black uppercase text-slate-500">Orders</div>
                <div className="mt-2 text-xl font-black text-slate-900">{detail.totalOrders}</div>
              </div>
            </section>

            {detail.type === "REGISTERED" && profileDraft && (
              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-900">Profile</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <AdminTextField label="Name" value={profileDraft.name} onChange={(value) => setProfileDraft((prev) => ({ ...prev, name: value }))} />
                  <AdminTextField label="Phone" value={profileDraft.phone} onChange={(value) => setProfileDraft((prev) => ({ ...prev, phone: value }))} />
                  <AdminTextField label="City" value={profileDraft.city} onChange={(value) => setProfileDraft((prev) => ({ ...prev, city: value }))} />
                  <AdminTextField label="Address" value={profileDraft.address} onChange={(value) => setProfileDraft((prev) => ({ ...prev, address: value }))} />
                  <AdminTextarea label="Internal profile note" rows={3} value={profileDraft.note} onChange={(value) => setProfileDraft((prev) => ({ ...prev, note: value }))} />
                  <div className="self-end">
                    <AdminToggle label="Active account" checked={profileDraft.active !== false} onChange={(value) => setProfileDraft((prev) => ({ ...prev, active: value }))} />
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-blue-900">
                <MessageSquarePlus size={16} />
                Add customer care note
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr_auto]">
                <AdminSelect label="Type" options={NOTE_TYPE_OPTIONS} value={noteDraft.type} onChange={(value) => setNoteDraft((prev) => ({ ...prev, type: value }))} />
                <AdminTextarea label="Note" rows={2} value={noteDraft.content} onChange={(value) => setNoteDraft((prev) => ({ ...prev, content: value }))} />
                <button onClick={() => void addNote()} className="self-end rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white hover:bg-blue-800">
                  Add note
                </button>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
                  <WalletCards size={16} />
                  Order history
                </div>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {(detail.orders || []).map((order) => (
                    <div key={order.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-black text-slate-900">{order.orderNo}</div>
                        <div className="font-black text-emerald-600">{formatCurrency(order.total)}</div>
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-500">
                        {order.status} · {order.paymentStatus} · {shortDate(order.createdAt)}
                      </div>
                      <div className="mt-2 text-xs font-bold text-slate-600">
                        {(order.items || []).slice(0, 3).map((item) => item.variantName || item.name || item.sku).join(", ")}
                      </div>
                    </div>
                  ))}

                  {!(detail.orders || []).length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                      No orders.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-black text-slate-900">Care notes</div>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {(detail.notes || []).map((note) => (
                    <div key={note.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700">{note.type}</span>
                        <span className="text-[11px] font-bold text-slate-400">{shortDate(note.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{note.content}</p>
                    </div>
                  ))}

                  {!(detail.notes || []).length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-400">
                      No care notes.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </AdminDrawer>
    </>
  );
}
