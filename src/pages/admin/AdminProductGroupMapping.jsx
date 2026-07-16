import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  setAdminProductGroupsApi,
} from "../../services/AdminCatalogApiService";

function clearStorefrontProductCache() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("gundam-public-api-cache:") &&
        key.includes("/api/products")
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage errors.
  }
}

export default function AdminProductGroupMapping() {
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [rows, ref] = await Promise.all([
        getAdminProductsFromApi(),
        getAdminCatalogReferenceApi(),
      ]);

      setProducts(rows);
      setGroups(ref.groups || []);
    } catch (error) {
      console.error("ADMIN_PRODUCT_GROUP_MAPPING_ERROR", error);
      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return;
      }
      setApiError(error?.message || "Cannot load product group mapping.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((item) =>
      !q ||
      [item.sku, item.slug, item.nameVi, item.nameEn, item.category?.nameVi, item.supplier?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, query]);

  async function toggleAndSave(product, groupId) {
    if (savingId) return;

    const currentGroupIds = Array.isArray(product.groupIds)
      ? product.groupIds.filter(Boolean)
      : [];

    const nextGroupIds = currentGroupIds.includes(groupId)
      ? currentGroupIds.filter((id) => id !== groupId)
      : [...currentGroupIds, groupId];

    setSavingId(product.id);
    setApiError("");

    setProducts((prev) =>
      prev.map((item) =>
        item.id === product.id
          ? { ...item, groupIds: nextGroupIds }
          : item
      )
    );

    try {
      const updated = await setAdminProductGroupsApi(
        product.id,
        nextGroupIds
      );

      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...updated,
                groupIds: updated.groupIds || nextGroupIds,
              }
            : item
        )
      );

      clearStorefrontProductCache();
    } catch (error) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...product, groupIds: currentGroupIds }
            : item
        )
      );

      setApiError(error?.message || "Không thể lưu nhóm sản phẩm.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Product Group Mapping"
        desc="Bấm vào nhóm để gán hoặc bỏ gán. Thay đổi được tự động lưu ngay vào database."
        action={
          <button onClick={() => void reload()} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
            <RefreshCcw size={15} className="mr-1 inline" />
            Refresh
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
        PostgreSQL Mapping · {loading ? "Loading..." : `${products.length} products · ${groups.length} groups`}
      </section>

      {apiError && <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">{apiError}</section>}

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent px-2 text-sm outline-none" placeholder="Tìm sản phẩm..." />
        </div>
      </section>

      <section className="overflow-x-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Groups</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((product) => (
              <tr key={product.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border bg-slate-50">
                      {product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div>
                      <div className="font-black text-slate-950">{product.nameVi}</div>
                      <div className="text-xs text-slate-500">{product.nameEn}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-bold">{product.sku}</td>
                <td className="px-4 py-3 text-slate-600">{product.category?.nameVi || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {groups.map((group) => {
                      const checked = product.groupIds?.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          type="button"
                          onClick={() => void toggleAndSave(product, group.id)}
                          disabled={savingId === product.id}
                          className={`rounded-xl px-3 py-2 text-xs font-black disabled:cursor-wait disabled:opacity-60 ${
                            checked
                              ? "bg-blue-700 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-50"
                          }`}
                        >
                          {group.nameVi}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`inline-flex rounded-full px-3 py-2 text-xs font-black ${
                      savingId === product.id
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {savingId === product.id ? "Đang lưu..." : "Tự động lưu"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
