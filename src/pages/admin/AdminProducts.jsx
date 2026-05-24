import { useEffect, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import {
  AdminTextarea,
  AdminTextField,
  AdminToggle,
} from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useLang } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";
import { loginAdmin } from "../../services/AdminAuthService";
import {
  createAdminProductApi,
  deactivateAdminProductApi,
  getAdminProductsFromApi,
  updateAdminProductApi,
} from "../../services/AdminProductApiService";

const emptyDraft = {
  id: "",
  sku: "",
  slug: "",
  nameVi: "",
  nameEn: "",
  descriptionText: "",
  price: 0,
  stock: 0,
  active: true,
};

function getCopy(lang) {
  return {
    title: lang === "en" ? "Products" : "Sản phẩm",
    desc:
      lang === "en"
        ? "Backend product master data: SKU, slug, name, price, stock and active status."
        : "Quản lý master data sản phẩm backend: SKU, slug, tên, giá, tồn kho và trạng thái hiển thị.",
    create: lang === "en" ? "Create product" : "Tạo sản phẩm",
    refresh: lang === "en" ? "Refresh" : "Tải lại",
    search:
      lang === "en"
        ? "Search SKU, slug, product name..."
        : "Tìm SKU, slug, tên sản phẩm...",
    backendSource:
      lang === "en"
        ? "PostgreSQL Products"
        : "Sản phẩm PostgreSQL",
    backendDesc:
      lang === "en"
        ? "This page reads and updates product data directly from PostgreSQL."
        : "Trang này đọc và cập nhật dữ liệu sản phẩm trực tiếp từ PostgreSQL.",
    loadError:
      lang === "en"
        ? "Cannot load backend products."
        : "Không tải được sản phẩm backend.",
    noRows:
      lang === "en"
        ? "No backend products found."
        : "Chưa có sản phẩm backend.",
    edit: lang === "en" ? "Edit product" : "Sửa sản phẩm",
    newProduct: lang === "en" ? "New product" : "Sản phẩm mới",
  };
}

function makeSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDraft(product = {}) {
  return {
    ...emptyDraft,
    ...product,
    nameVi: product.nameVi || product.name?.vi || "",
    nameEn: product.nameEn || product.name?.en || product.nameVi || product.name?.vi || "",
    descriptionText:
      product.descriptionText ||
      product.description?.vi ||
      product.short?.vi ||
      product.backendRaw?.description ||
      "",
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    active: product.active !== false,
  };
}

function ProductForm({ draft, setDraft }) {
  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "nameVi" && !prev.slug) {
        next.slug = makeSlug(value);
      }

      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">PostgreSQL Product</div>
        <p className="mt-1 text-xs font-semibold text-emerald-700/80">
          Các field trong form này lưu trực tiếp vào bảng Product của backend.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextField
          label="SKU"
          required
          placeholder="HG-AERIAL-144-BD"
          value={draft.sku}
          onChange={(value) => patch("sku", value)}
        />
        <AdminTextField
          label="Slug"
          required
          placeholder="hg-1-144-gundam-aerial"
          value={draft.slug}
          onChange={(value) => patch("slug", makeSlug(value))}
        />
        <AdminTextField
          label="Tên tiếng Việt"
          required
          value={draft.nameVi}
          onChange={(value) => patch("nameVi", value)}
        />
        <AdminTextField
          label="Tên tiếng Anh"
          value={draft.nameEn}
          onChange={(value) => patch("nameEn", value)}
        />
        <AdminTextField
          label="Giá bán"
          type="number"
          suffix="đ"
          value={draft.price}
          onChange={(value) => patch("price", value)}
        />
        <AdminTextField
          label="Tồn kho"
          type="number"
          value={draft.stock}
          onChange={(value) => patch("stock", value)}
        />
      </div>

      <AdminTextarea
        label="Mô tả"
        rows={5}
        value={draft.descriptionText}
        onChange={(value) => patch("descriptionText", value)}
      />

      <AdminToggle
        label="Đang hiển thị / active"
        checked={draft.active !== false}
        onChange={(value) => patch("active", value)}
      />
    </div>
  );
}

export default function AdminProducts() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      await loginAdmin("admin@gundam.local", "admin123");
      const rows = await getAdminProductsFromApi();
      setProducts(Array.isArray(rows) ? rows : []);
      return rows;
    } catch (error) {
      console.error("ADMIN_PRODUCTS_BACKEND_ERROR", error);
      setProducts([]);
      setApiError(
        error?.status
          ? `${error.status} - ${error?.message || t.loadError}`
          : error?.message || t.loadError
      );
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const haystack = [
        product.sku,
        product.slug,
        product.nameVi,
        product.nameEn,
        product.descriptionText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !q || haystack.includes(q);
    });
  }, [products, query]);

  const summary = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((item) => item.active !== false).length,
      stock: products.reduce((sum, item) => sum + Number(item.stock || 0), 0),
      inventoryValue: products.reduce(
        (sum, item) => sum + Number(item.stock || 0) * Number(item.price || 0),
        0
      ),
    };
  }, [products]);

  function openCreate() {
    setDraft(emptyDraft);
    setDrawerOpen(true);
  }

  function openEdit(product) {
    setDraft(normalizeDraft(product));
    setDrawerOpen(true);
  }

  async function save() {
    const payload = normalizeDraft(draft);

    try {
      if (payload.id) {
        await updateAdminProductApi(payload.id, payload);
      } else {
        await createAdminProductApi(payload);
      }

      setDrawerOpen(false);
      await reload();
    } catch (error) {
      alert(error?.message || "Save product failed.");
    }
  }

  async function deactivate(product) {
    if (!window.confirm(`Ẩn sản phẩm ${product.sku}?`)) return;

    try {
      await deactivateAdminProductApi(product.id);
      await reload();
    } catch (error) {
      alert(error?.message || "Deactivate product failed.");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title={t.title}
        desc={t.desc}
        action={
          <button
            onClick={openCreate}
            className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
          >
            <Plus size={15} className="mr-1 inline" />
            {t.create}
          </button>
        }
      />

      <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">{t.backendSource}</div>
        <p className="mt-1 text-sm font-semibold text-emerald-700/80">{t.backendDesc}</p>
      </section>

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4">
          <div className="text-sm font-black text-red-700">{t.loadError}</div>
          <p className="mt-1 text-sm font-semibold text-red-700/80">{apiError}</p>
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Total products</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.active}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Stock</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.stock}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Inventory value</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.inventoryValue)}</p>
        </div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent px-2 text-sm outline-none"
              placeholder={t.search}
            />
          </div>

          <button
            onClick={() => void reload()}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            <RefreshCcw size={15} className="mr-1 inline" />
            {loading ? "Loading..." : t.refresh}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Actions</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center font-bold text-slate-400">
                    {loading ? "Loading backend products..." : t.noRows}
                  </td>
                </tr>
              ) : (
                rows.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 size={14} className="mr-1 inline" />
                          Edit
                        </button>

                        <button
                          onClick={() => void deactivate(product)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{product.nameVi}</div>
                      <div className="text-xs font-semibold text-slate-500">{product.nameEn}</div>
                    </td>

                    <td className="px-4 py-3 font-bold">{product.sku}</td>
                    <td className="px-4 py-3 text-slate-500">{product.slug}</td>
                    <td className="px-4 py-3 text-right font-black text-red-500">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-right font-black">{product.stock}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                        DB PRODUCT
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black ${
                          product.active !== false
                            ? "bg-blue-50 text-blue-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.active !== false ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer
        open={drawerOpen}
        title={draft.id ? t.edit : t.newProduct}
        subtitle={draft.id ? draft.sku : "PostgreSQL backend product"}
        onClose={() => setDrawerOpen(false)}
        onSave={save}
        saveLabel="Save product"
      >
        <ProductForm draft={draft} setDraft={setDraft} />
      </AdminDrawer>
    </>
  );
}
