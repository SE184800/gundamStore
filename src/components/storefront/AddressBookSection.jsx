import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "../../store/CmsStore";
import {
  createMyAddress,
  deleteMyAddress,
  getMyAddresses,
  setDefaultMyAddress,
  updateMyAddress,
} from "../../services/AccountApiService";

const copy = {
  vi: {
    homeLabel: "Nhà riêng",
    defaultCity: "Hồ Chí Minh",
    loadError: "Không thể tải sổ địa chỉ.",
    receiverError: "Vui lòng nhập tên người nhận ít nhất 2 ký tự.",
    phoneError: "Vui lòng nhập số điện thoại hợp lệ.",
    addressError: "Vui lòng nhập địa chỉ chi tiết ít nhất 5 ký tự.",
    updated: "Đã cập nhật địa chỉ.",
    added: "Đã thêm địa chỉ mới.",
    saveError: "Không thể lưu địa chỉ.",
    deleteConfirm: "Xóa địa chỉ này?",
    deleted: "Đã xóa địa chỉ.",
    deleteError: "Không thể xóa địa chỉ.",
    defaultSet: "Đã đặt làm địa chỉ mặc định.",
    defaultError: "Không thể đặt địa chỉ mặc định.",
    title: "Sổ địa chỉ giao hàng",
    desc: "Quản lý nhiều địa chỉ và chọn địa chỉ mặc định khi thanh toán.",
    addressName: "Tên địa chỉ",
    addressNamePlaceholder: "Nhà riêng / Công ty",
    receiver: "Người nhận",
    phone: "Số điện thoại",
    city: "Tỉnh / Thành phố",
    district: "Quận / Huyện",
    ward: "Phường / Xã",
    detail: "Địa chỉ chi tiết",
    postalCode: "Mã bưu điện",
    setDefault: "Đặt làm địa chỉ mặc định",
    cancelEdit: "Hủy chỉnh sửa",
    updateAddress: "Cập nhật địa chỉ",
    addAddress: "Thêm địa chỉ",
    empty: "Chưa có địa chỉ nào.",
    default: "Mặc định",
    edit: "Sửa",
    delete: "Xóa",
  },
  en: {
    homeLabel: "Home",
    defaultCity: "Ho Chi Minh City",
    loadError: "Unable to load address book.",
    receiverError: "Please enter a receiver name with at least 2 characters.",
    phoneError: "Please enter a valid phone number.",
    addressError: "Please enter a detailed address with at least 5 characters.",
    updated: "Address updated.",
    added: "New address added.",
    saveError: "Unable to save address.",
    deleteConfirm: "Delete this address?",
    deleted: "Address deleted.",
    deleteError: "Unable to delete address.",
    defaultSet: "Default address updated.",
    defaultError: "Unable to set default address.",
    title: "Shipping address book",
    desc: "Manage multiple addresses and choose the default address for checkout.",
    addressName: "Address name",
    addressNamePlaceholder: "Home / Office",
    receiver: "Receiver",
    phone: "Phone",
    city: "Province / City",
    district: "District",
    ward: "Ward",
    detail: "Detailed address",
    postalCode: "Postal code",
    setDefault: "Set as default address",
    cancelEdit: "Cancel edit",
    updateAddress: "Update address",
    addAddress: "Add address",
    empty: "No address yet.",
    default: "Default",
    edit: "Edit",
    delete: "Delete",
  },
};

const emptyForm = {
  label: "",
  receiver: "",
  phone: "",
  address: "",
  city: "",
  district: "",
  ward: "",
  postalCode: "",
  isDefault: false,
};

function AddressInput({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function formatAddress(item) {
  return [item.address, item.ward, item.district, item.city]
    .filter(Boolean)
    .join(", ");
}

export default function AddressBookSection() {
  const [lang] = useLang();
  const t = copy[lang] || copy.vi;
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(() => ({ ...emptyForm, label: t.homeLabel, city: t.defaultCity }));
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAddresses() {
    try {
      setLoading(true);
      setError("");
      const items = await getMyAddresses();
      setAddresses(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err?.message || t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function patch(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      label: item.label || t.homeLabel,
      receiver: item.receiver || "",
      phone: item.phone || "",
      address: item.address || "",
      city: item.city || "",
      district: item.district || "",
      ward: item.ward || "",
      postalCode: item.postalCode || "",
      isDefault: Boolean(item.isDefault),
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId("");
    setForm({ ...emptyForm, label: t.homeLabel, city: t.defaultCity });
  }

  function validateAddressForm() {
    const receiver = String(form.receiver || "").trim();
    const phone = String(form.phone || "").trim();
    const address = String(form.address || "").trim();

    if (receiver.length < 2) {
      setError(t.receiverError);
      return false;
    }

    if (phone.length < 8) {
      setError(t.phoneError);
      return false;
    }

    if (address.length < 5) {
      setError(t.addressError);
      return false;
    }

    return true;
  }

  async function saveAddress() {
    if (!validateAddressForm()) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        ...form,
        isDefault: Boolean(form.isDefault),
      };

      if (editingId) {
        await updateMyAddress(editingId, payload);
        setMessage(t.updated);
      } else {
        await createMyAddress(payload);
        setMessage(t.added);
      }

      resetForm();
      await loadAddresses();
    } catch (err) {
      setError(err?.message || t.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    if (!window.confirm(t.deleteConfirm)) return;

    try {
      setMessage("");
      setError("");
      await deleteMyAddress(id);
      await loadAddresses();
      setMessage(t.deleted);
    } catch (err) {
      setError(err?.message || t.deleteError);
    }
  }

  async function makeDefault(id) {
    try {
      setMessage("");
      setError("");
      await setDefaultMyAddress(id);
      await loadAddresses();
      setMessage(t.defaultSet);
    } catch (err) {
      setError(err?.message || t.defaultError);
    }
  }

  return (
    <section id="address" className="mt-8 rounded-4xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <MapPin size={20} />
        </span>
        <div>
          <h2 className="text-xl font-black text-slate-950">{t.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {t.desc}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-700">
          {message}
        </div>
      )}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <AddressInput label={t.addressName} value={form.label} onChange={(value) => patch("label", value)} placeholder={t.addressNamePlaceholder} />
        <AddressInput label={t.receiver} value={form.receiver} onChange={(value) => patch("receiver", value)} />
        <AddressInput label={t.phone} value={form.phone} onChange={(value) => patch("phone", value)} />
        <AddressInput label={t.city} value={form.city} onChange={(value) => patch("city", value)} />
        <AddressInput label={t.district} value={form.district} onChange={(value) => patch("district", value)} />
        <AddressInput label={t.ward} value={form.ward} onChange={(value) => patch("ward", value)} />
        <AddressInput label={t.detail} value={form.address} onChange={(value) => patch("address", value)} />
        <AddressInput label={t.postalCode} value={form.postalCode} onChange={(value) => patch("postalCode", value)} />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm font-black text-slate-700">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(event) => patch("isDefault", event.target.checked)}
        />
        {t.setDefault}
      </label>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
          >
            {t.cancelEdit}
          </button>
        )}

        <button
          type="button"
          onClick={saveAddress}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {editingId ? t.updateAddress : t.addAddress}
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex min-h-32 items-center justify-center rounded-2xl bg-slate-50">
            <Loader2 className="animate-spin text-blue-700" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
            {t.empty}
          </div>
        ) : (
          <div className="grid gap-3">
            {addresses.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-slate-950">{item.label}</h3>
                      {item.isDefault && (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          {t.default}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm font-bold text-slate-700">
                      {item.receiver} · {item.phone}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatAddress(item)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!item.isDefault && (
                      <button
                        type="button"
                        onClick={() => makeDefault(item.id)}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 hover:bg-amber-100"
                      >
                        <Star size={14} />
                        {t.default}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
                    >
                      <Pencil size={14} />
                      {t.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeAddress(item.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                      {t.delete}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
