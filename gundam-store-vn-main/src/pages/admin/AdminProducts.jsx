import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import {
  AdminImageUploader,
  AdminSelect,
  AdminTextarea,
  AdminTextField,
  AdminToggle,
} from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import AdminStatusBadge from "../../components/admin/AdminStatusBadge";
import AdminTabs from "../../components/admin/AdminTabs";
import { useCms, useLang } from "../../store/CmsStore";
import { getAdminText, makeAdminId, makeAdminSlug, formatMoney } from "./productAdminV4Helpers";

const emptyProduct = {
  id: "",
  sku: "",
  slug: "",
  name: { vi: "", en: "" },
  short: { vi: "", en: "" },
  description: { vi: "", en: "" },
  categoryId: "",
  supplierId: "",
  brand: "Bandai",
  grade: "HG",
  scale: "1/144",
  status: "inStock",
  active: true,
  media: { card: "", home: "", detailMain: "", gallery: [], hover: "", box: "" },
  specsText: "",
  boxItemsText: "",
};

function listToText(list) {
  if (!Array.isArray(list)) return "";
  return list.map((item) => typeof item === "string" ? item : `${item.label || ""} | ${item.value || ""}`).join("\n");
}

function textToSpecs(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), value: rest.join("|").trim() };
    });
}

function textToList(text) {
  return String(text || "").split("\n").map((x) => x.trim()).filter(Boolean);
}

function ProductForm({ draft, setDraft, categories, suppliers, lang }) {
  const [tab, setTab] = useState("basic");

  function patch(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function patchNested(parent, field, value) {
    setDraft((prev) => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));
  }

  function patchName(locale, value) {
    setDraft((prev) => ({
      ...prev,
      name: { ...prev.name, [locale]: value },
      slug: prev.slug || makeAdminSlug(value),
    }));
  }

  const tabs = [
    { key: "basic", label: "Basic" },
    { key: "classification", label: "Classification" },
    { key: "media", label: "Media" },
    { key: "details", label: "Specs / SEO" },
  ];

  return (
    <div>
      <AdminTabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === "basic" && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminTextField label="Tên sản phẩm tiếng Việt" required tip="Tên chính hiển thị trên website tiếng Việt." placeholder="Ví dụ: RG 1/144 Hi-ν Gundam" value={draft.name?.vi} onChange={(v) => patchName("vi", v)} />
              <AdminTextField label="Tên sản phẩm tiếng Anh" tip="Tên hiển thị khi khách chọn tiếng Anh." placeholder="Example: RG 1/144 Hi-ν Gundam" value={draft.name?.en} onChange={(v) => patchName("en", v)} />
              <AdminTextField label="SKU / Mã sản phẩm" required tip="Mã nội bộ để quản lý tồn kho, giá và đơn hàng." placeholder="RG-HINU-144-BD" value={draft.sku} onChange={(v) => patch("sku", v)} />
              <AdminTextField label="Đường dẫn sản phẩm" tip="URL sản phẩm ngoài website, hệ thống có thể tự tạo từ tên." placeholder="rg-1-144-hi-nu-gundam" value={draft.slug} onChange={(v) => patch("slug", v)} />
            </div>

            <AdminTextarea label="Mô tả ngắn tiếng Việt" tip="Hiển thị ở card hoặc đầu trang chi tiết sản phẩm." placeholder="Mô tả ngắn..." value={draft.short?.vi} onChange={(v) => patchNested("short", "vi", v)} />
            <AdminTextarea label="Mô tả ngắn tiếng Anh" tip="Bản tiếng Anh của mô tả ngắn." placeholder="Short description..." value={draft.short?.en} onChange={(v) => patchNested("short", "en", v)} />
            <AdminTextarea label="Mô tả chi tiết tiếng Việt" tip="Nội dung chi tiết trong trang sản phẩm." rows={5} value={draft.description?.vi} onChange={(v) => patchNested("description", "vi", v)} />
            <AdminTextarea label="Mô tả chi tiết tiếng Anh" tip="Bản tiếng Anh cho mô tả chi tiết." rows={5} value={draft.description?.en} onChange={(v) => patchNested("description", "en", v)} />
          </div>
        )}

        {tab === "classification" && (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <AdminSelect label="Danh mục sản phẩm" required tip="Chọn HG, RG, MG, PG, Tools... để khách lọc sản phẩm." value={draft.categoryId} onChange={(v) => patch("categoryId", v)} options={[{ label: "Chưa chọn", value: "" }, ...categories.map((c) => ({ label: getAdminText(c.name, lang) || c.code, value: c.id }))]} />
              <AdminSelect label="Nhà cung cấp" tip="Nguồn hàng hoặc đơn vị phân phối sản phẩm." value={draft.supplierId} onChange={(v) => patch("supplierId", v)} options={[{ label: "Chưa chọn", value: "" }, ...suppliers.map((s) => ({ label: s.name, value: s.id }))]} />
              <AdminTextField label="Thương hiệu" tip="Ví dụ: Bandai Spirits, Kotobukiya..." value={draft.brand} onChange={(v) => patch("brand", v)} />
              <AdminTextField label="Grade" tip="Ví dụ: HG, RG, MG, PG..." value={draft.grade} onChange={(v) => patch("grade", v)} />
              <AdminTextField label="Tỷ lệ" tip="Ví dụ: 1/144, 1/100, Non-scale..." value={draft.scale} onChange={(v) => patch("scale", v)} />
              <AdminSelect label="Trạng thái bán" tip="Quyết định sản phẩm đang bán thường, pre-order, sale hay tạm ẩn." value={draft.status} onChange={(v) => patch("status", v)} options={["inStock", "preorder", "sale", "inactive"]} />
            </div>

            <AdminToggle label="Cho phép hiển thị sản phẩm" tip="Tắt nếu sản phẩm chưa sẵn sàng public." checked={draft.active !== false} onChange={(v) => patch("active", v)} />
          </div>
        )}

        {tab === "media" && (
          <div className="grid gap-5 md:grid-cols-2">
            <AdminImageUploader label="Ảnh card sản phẩm" required tip="Ảnh chính hiển thị ở trang chủ và danh sách sản phẩm." recommended="800 x 800 px" value={draft.media?.card} onChange={(v) => patchNested("media", "card", v)} />
            <AdminImageUploader label="Ảnh trang chủ" tip="Ảnh tối ưu cho block sản phẩm ngoài homepage." recommended="1000 x 800 px" value={draft.media?.home} onChange={(v) => patchNested("media", "home", v)} />
            <AdminImageUploader label="Ảnh chính trang chi tiết" tip="Ảnh lớn đầu trang chi tiết sản phẩm." recommended="1200 x 1200 px" value={draft.media?.detailMain} onChange={(v) => patchNested("media", "detailMain", v)} />
            <AdminImageUploader label="Ảnh hover" tip="Ảnh thay thế khi rê chuột vào product card." recommended="800 x 800 px" value={draft.media?.hover} onChange={(v) => patchNested("media", "hover", v)} />
            <AdminImageUploader label="Ảnh hộp sản phẩm" tip="Dùng cho collector muốn xem tình trạng hộp." recommended="1000 x 800 px" value={draft.media?.box} onChange={(v) => patchNested("media", "box", v)} />
          </div>
        )}

        {tab === "details" && (
          <div className="space-y-5">
            <AdminTextarea label="Thông số kỹ thuật" tip="Mỗi dòng nhập dạng: Tên thông số | Giá trị. Ví dụ: Scale | 1/144" rows={7} value={draft.specsText} onChange={(v) => patch("specsText", v)} />
            <AdminTextarea label="Đập hộp có gì" tip="Mỗi dòng là một item trong hộp." rows={6} value={draft.boxItemsText} onChange={(v) => patch("boxItemsText", v)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyProduct);

  const categories = state.productCategories || state.categories || [];
  const suppliers = state.suppliers || [];
  const prices = state.productPrices || [];
  const inventory = state.inventory || [];
  const groups = state.productGroups || [];
  const mappings = state.productGroupMappings || [];

  const rows = useMemo(() => {
    return (state.products || []).filter((p) => {
      const category = categories.find((c) => c.id === p.categoryId);
      const supplier = suppliers.find((sp) => sp.id === p.supplierId);
      const mapping = mappings.find((m) => m.productId === p.id);
      const productGroupIds = mapping?.groupIds || mapping?.collectionKeys || [];
      const productGroups = groups.filter((g) => productGroupIds.includes(g.id) || productGroupIds.includes(g.key));

      const q = query.toLowerCase();
      const haystack = [
        getAdminText(p.name, lang),
        p.sku,
        p.slug,
        getAdminText(category?.name, lang),
        category?.code,
        supplier?.name,
        ...productGroups.map((g) => getAdminText(g.name, lang) || g.label || g.key),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
      if (supplierFilter !== "all" && p.supplierId !== supplierFilter) return false;
      if (groupFilter !== "all" && !productGroupIds.includes(groupFilter)) return false;

      return true;
    });
  }, [state.products, query, lang, categories, suppliers, groups, mappings, categoryFilter, supplierFilter, groupFilter]);

  function openCreate() {
    setDraft(emptyProduct);
    setDrawerOpen(true);
  }

  function openEdit(product) {
    setDraft({
      ...emptyProduct,
      ...product,
      media: product.media || { card: product.imageUrl || "", home: "", detailMain: product.images?.[0] || "", gallery: [], hover: "", box: "" },
      specsText: listToText(product.specs),
      boxItemsText: listToText(product.boxItems),
    });
    setDrawerOpen(true);
  }

  function save() {
    const id = draft.id || makeAdminId("prod");
    const media = draft.media || {};
    actions.saveProduct({
      ...draft,
      id,
      slug: draft.slug || makeAdminSlug(draft.name?.vi || draft.name?.en || id),
      imageUrl: media.card || media.home || media.detailMain || "",
      images: [media.detailMain, media.card, media.home, media.box].filter(Boolean),
      specs: textToSpecs(draft.specsText),
      boxItems: textToList(draft.boxItemsText),
    });
    setDrawerOpen(false);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Product Management"
        title="Products"
        desc="Quản lý master data sản phẩm. Giá, tồn kho, chiết khấu và grouping được tách sang module riêng."
        action={<button onClick={openCreate} className="rounded-md bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"><Plus size={15} className="mr-1 inline" />Create product</button>}
      />

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <div className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent px-2 text-sm outline-none"
              placeholder="Tìm tên, SKU, danh mục, nhóm, nhà cung cấp..."
            />
          </div>

          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{getAdminText(c.name, lang) || c.code}</option>
            ))}
          </select>

          <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <option value="all">Tất cả NCC</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            <option value="all">Tất cả nhóm</option>
            {groups.map((g) => (
              <option key={g.id || g.key} value={g.id || g.key}>{getAdminText(g.name, lang) || g.label || g.key}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Actions</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Groups</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const supplier = suppliers.find((s) => s.id === product.supplierId);
                const price = prices.find((p) => p.productId === product.id);
                const stock = inventory.find((i) => i.productId === product.id);

                return (
                  <tr key={product.id} className="group border-t border-slate-100 hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 group-hover:bg-slate-50">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(product)} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Edit3 size={14} className="mr-1 inline" />Edit</button>
                        <button onClick={() => actions.deleteProduct(product.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                          {product.imageUrl ? <img src={product.imageUrl} className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                          <div className="font-black text-slate-950">{getAdminText(product.name, lang)}</div>
                          <div className="text-xs font-semibold text-slate-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getAdminText(category?.name, lang) || "-"}</td>
                    <td className="px-4 py-3">{supplier?.name || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const mapping = mappings.find((m) => m.productId === product.id);
                          const groupIds = mapping?.groupIds || mapping?.collectionKeys || [];
                          const names = groups
                            .filter((g) => groupIds.includes(g.id) || groupIds.includes(g.key))
                            .map((g) => getAdminText(g.name, lang) || g.label || g.key);

                          return names.length ? names.slice(0, 3).map((name) => (
                            <span key={name} className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{name}</span>
                          )) : <span className="text-slate-400">-</span>;
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-blue-700">{formatMoney(price?.price || product.price || 0)}</td>
                    <td className="px-4 py-3 text-right font-black">{stock?.available ?? product.stock ?? 0}</td>
                    <td className="px-4 py-3"><AdminStatusBadge>{product.status || "inStock"}</AdminStatusBadge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDrawer open={drawerOpen} title={draft.id ? "Edit product" : "Create product"} subtitle="Tất cả field có tên dễ hiểu và tips để vận hành dễ hơn." onClose={() => setDrawerOpen(false)} onSave={save} saveLabel="Save product">
        <ProductForm draft={draft} setDraft={setDraft} categories={categories} suppliers={suppliers} lang={lang} />
      </AdminDrawer>
    </>
  );
}
