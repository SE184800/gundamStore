import { useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import AdminDrawer from "../../components/admin/AdminDrawer";
import {
  AdminImageUploader,
  AdminMultiImageUploader,
  AdminVideoUploader,
  AdminSelect,
  AdminTextarea,
  AdminTextField,
  AdminToggle,
} from "../../components/admin/AdminField";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { useLang } from "../../store/CmsStore";
import { formatCurrency } from "../../utils/format";
import { logoutAdmin } from "../../services/AdminAuthService";
import {
  createAdminProductApi,
  deactivateAdminProductApi,
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  updateAdminProductApi,
} from "../../services/AdminProductApiService";

const emptyDraft = {
  id: "",
  sku: "",
  slug: "",
  barcode: "",

  nameVi: "",
  nameEn: "",
  shortVi: "",
  shortEn: "",
  descriptionText: "",
  descriptionEn: "",

  price: 0,
  oldPrice: 0,
  stock: 0,
  status: "inStock",
  active: true,

  imageUrl: "",
  images: [],
  galleryText: "",
  image360Url: "",
  videoUrl: "",
  specMaker: "",
  specMaterial: "",
  specDifficulty: "",
  specHeight: "",
  specModelNo: "",
  specReleaseDate: "",

  brand: "Bandai",
  grade: "",
  scale: "",
  tone: "blue",
  sold: 0,
  rating: 0,

  specsText: "",
  boxItemsText: "",

  categoryId: "",
  supplierId: "",
  groupIds: [],
};

const STATUS_OPTIONS = [
  { value: "inStock", label: "Hàng sẵn / In stock" },
  { value: "preorder", label: "Pre-order" },
  { value: "sale", label: "Sale" },
  { value: "comingSoon", label: "Coming soon" },
  { value: "outOfStock", label: "Hết hàng / Out of stock" },
  { value: "inactive", label: "Inactive" },
];

const TONE_OPTIONS = ["blue", "cyan", "sky", "red", "gold", "slate", "violet"];

function getCopy(lang) {
  return {
    title: lang === "en" ? "Products" : "Sản phẩm",
    desc:
      lang === "en"
        ? "Manage backend product master data: images, category, supplier, groups, price and stock."
        : "Quản lý master data sản phẩm backend: hình ảnh, danh mục, NCC, nhóm, giá và tồn kho.",
    create: lang === "en" ? "Create product" : "Tạo sản phẩm",
    refresh: lang === "en" ? "Refresh" : "Tải lại",
    search:
      lang === "en"
        ? "Search SKU, slug, product name..."
        : "Tìm SKU, slug, tên sản phẩm...",
    backendSource:
      lang === "en"
        ? "PostgreSQL Product Catalog"
        : "Catalog sản phẩm PostgreSQL",
    backendDesc:
      lang === "en"
        ? "This page reads and updates product data, images, category, supplier and groups from PostgreSQL."
        : "Trang này đọc và cập nhật sản phẩm, hình ảnh, danh mục, nhà cung cấp và nhóm từ PostgreSQL.",
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

function formatSpecsText(specs = []) {
  if (!Array.isArray(specs) || specs.length === 0) return "";
  return specs
    .map((item) => {
      if (typeof item === "string") return item;
      return `${item.label || ""}: ${item.value || ""}`;
    })
    .join("\n");
}

function parseSpecsText(value = "") {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();

      if (!value) {
        return { label: "Info", value: label.trim() };
      }

      return {
        label: label.trim(),
        value,
      };
    });
}

function formatBoxItemsText(items = []) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return items.map((item) => String(item || "")).join("\n");
}

function parseBoxItemsText(value = "") {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatGalleryText(images = [], imageUrl = "") {
  const list = [
    imageUrl,
    ...(Array.isArray(images) ? images : []),
  ]
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      return item.url || item.src || "";
    })
    .filter(Boolean);

  return Array.from(new Set(list)).join("\n");
}

function parseGalleryText(value = "") {
  return Array.from(
    new Set(
      String(value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )
  );
}


function normalizeDraft(product = {}) {
  return {
    ...emptyDraft,
    ...product,

    nameVi: product.nameVi || product.name?.vi || "",
    nameEn: product.nameEn || product.name?.en || product.nameVi || product.name?.vi || "",

    shortVi: product.shortVi || product.short?.vi || "",
    shortEn: product.shortEn || product.short?.en || "",

    descriptionText:
      product.descriptionText ||
      product.description?.vi ||
      product.short?.vi ||
      product.backendRaw?.description ||
      "",
    descriptionEn: product.descriptionEn || product.description?.en || "",

    price: Number(product.price || 0),
    oldPrice: Number(product.oldPrice || 0),
    stock: Number(product.stock || 0),
    sold: Number(product.sold || 0),
    rating: Number(product.rating || 0),

    status: product.status || "inStock",
    active: product.active !== false,

    imageUrl: product.imageUrl || product.images?.[0] || "",
    images: product.images?.length ? product.images : product.imageUrl ? [product.imageUrl] : [],
    galleryText: formatGalleryText(product.images, product.imageUrl),
    image360Url: product.image360Url || product.media?.image360 || "",
    videoUrl: product.videoUrl || product.media?.video || "",
    specMaker: product.specMaker || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("maker"))?.value || "",
    specMaterial: product.specMaterial || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("material"))?.value || "",
    specDifficulty: product.specDifficulty || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("difficulty"))?.value || "",
    specHeight: product.specHeight || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("height"))?.value || "",
    specModelNo: product.specModelNo || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("model"))?.value || "",
    specReleaseDate: product.specReleaseDate || product.specs?.find?.((item) => String(item.label || "").toLowerCase().includes("release"))?.value || "",

    categoryId: product.categoryId || product.category?.id || "",
    supplierId: product.supplierId || product.supplier?.id || "",
    groupIds: Array.isArray(product.groupIds) ? product.groupIds : [],

    specsText: formatSpecsText(product.specs),
    boxItemsText: formatBoxItemsText(product.boxItems),
  };
}

function ProductForm({ draft, setDraft, reference }) {
  const categoryOptions = [
    { value: "", label: "Không chọn danh mục" },
    ...(reference.categories || []).map((item) => ({
      value: item.id,
      label: `${item.nameVi} (${item.code})`,
    })),
  ];

  const supplierOptions = [
    { value: "", label: "Không chọn nhà cung cấp" },
    ...(reference.suppliers || []).map((item) => ({
      value: item.id,
      label: `${item.name} (${item.code})`,
    })),
  ];

  function patch(field, value) {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "nameVi" && !prev.slug) {
        next.slug = makeSlug(value);
      }

      if (field === "imageUrl") {
        const currentGallery = parseGalleryText(prev.galleryText);
        const nextGallery = value
          ? Array.from(new Set([value, ...currentGallery]))
          : currentGallery.filter((url) => url !== prev.imageUrl);

        next.images = nextGallery;
        next.galleryText = nextGallery.join("\n");
      }

      return next;
    });
  }


  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">PostgreSQL Product Catalog</div>
        <p className="mt-1 text-xs font-semibold text-emerald-700/80">
          Form này lưu sản phẩm, hình ảnh, danh mục, nhà cung cấp và nhóm sản phẩm trực tiếp vào backend.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminImageUploader
          label="Ảnh đại diện / thumbnail"
          tip="Ảnh này dùng ngoài homepage, shop page, cart. Gallery bên dưới dùng cho trang chi tiết."
          value={draft.imageUrl}
          onChange={(value) => patch("imageUrl", value)}
          recommended="1200 x 1200 px"
        />

        <AdminImageUploader
          label="Ảnh 360 độ"
          tip="Dùng ảnh 360, ảnh xoay, GIF/WebP hoặc ảnh đại diện cho chế độ xem 360."
          value={draft.image360Url}
          onChange={(value) => patch("image360Url", value)}
          recommended="1200 x 1200 px"
        />
      </div>

      <AdminMultiImageUploader
        label="Gallery nhiều hình"
        tip="Upload nhiều ảnh cho trang chi tiết sản phẩm. Ảnh đầu tiên trong gallery thường là ảnh chính."
        value={parseGalleryText(draft.galleryText)}
        onChange={(images) => patch("galleryText", images.join("\n"))}
        recommended="1200 x 1200 px"
      />

      <AdminVideoUploader
        label="Video sản phẩm"
        tip="Video unbox, review, lắp ráp hoặc demo sản phẩm."
        value={draft.videoUrl}
        onChange={(value) => patch("videoUrl", value)}
      />

      <div className="grid gap-4 md:grid-cols-3">
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
          label="Barcode"
          placeholder="893..."
          value={draft.barcode}
          onChange={(value) => patch("barcode", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
          label="Mô tả ngắn VI"
          value={draft.shortVi}
          onChange={(value) => patch("shortVi", value)}
        />
        <AdminTextField
          label="Mô tả ngắn EN"
          value={draft.shortEn}
          onChange={(value) => patch("shortEn", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminTextarea
          label="Mô tả chi tiết VI"
          rows={5}
          value={draft.descriptionText}
          onChange={(value) => patch("descriptionText", value)}
        />
        <AdminTextarea
          label="Mô tả chi tiết EN"
          rows={5}
          value={draft.descriptionEn}
          onChange={(value) => patch("descriptionEn", value)}
        />
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <div className="text-sm font-black text-amber-800">Giá bán và tồn kho sẽ quản lý ở màn hình riêng</div>
        <p className="mt-1 text-xs font-semibold text-amber-700/80">
          Product Master chỉ giữ thông tin mô tả sản phẩm. Giá có hiệu lực theo ngày và tồn kho sẽ cập nhật ở Pricing / Inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminSelect
          label="Trạng thái hiển thị"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(value) => patch("status", value)}
        />
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500">
          Active được quản lý ở phần trạng thái hiển thị phía trên.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <AdminTextField
          label="Brand"
          value={draft.brand}
          onChange={(value) => patch("brand", value)}
        />
        <AdminTextField
          label="Grade"
          placeholder="HG / RG / MG / MGEX"
          value={draft.grade}
          onChange={(value) => patch("grade", value)}
        />
        <AdminTextField
          label="Scale"
          placeholder="1/144"
          value={draft.scale}
          onChange={(value) => patch("scale", value)}
        />
        <AdminSelect
          label="Tone"
          options={TONE_OPTIONS}
          value={draft.tone}
          onChange={(value) => patch("tone", value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AdminSelect
          label="Danh mục"
          options={categoryOptions}
          value={draft.categoryId}
          onChange={(value) => patch("categoryId", value)}
        />
        <AdminSelect
          label="Nhà cung cấp"
          options={supplierOptions}
          value={draft.supplierId}
          onChange={(value) => patch("supplierId", value)}
        />
      </div>

      <section className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
        <div className="text-sm font-black text-violet-800">Nhóm sản phẩm</div>
        <p className="mt-1 text-xs font-semibold text-violet-700/80">
          Product Master chỉ hiển thị thông tin sản phẩm. Việc gắn sản phẩm vào nhóm được quản lý tại màn hình Product Group Mapping.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(reference.groups || [])
            .filter((group) => draft.groupIds?.includes(group.id))
            .map((group) => (
              <span key={group.id} className="rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">
                {group.nameVi}
              </span>
            ))}
          {!draft.groupIds?.length && (
            <span className="text-xs font-bold text-violet-500">Chưa gắn nhóm.</span>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 text-sm font-black text-slate-800">Thông số hiển thị trên trang sản phẩm</div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminTextField label="Maker / Hãng" value={draft.specMaker} onChange={(value) => patch("specMaker", value)} />
          <AdminTextField label="Material / Chất liệu" value={draft.specMaterial} onChange={(value) => patch("specMaterial", value)} />
          <AdminTextField label="Difficulty / Độ khó" value={draft.specDifficulty} onChange={(value) => patch("specDifficulty", value)} />
          <AdminTextField label="Height / Chiều cao" value={draft.specHeight} onChange={(value) => patch("specHeight", value)} />
          <AdminTextField label="Model No." value={draft.specModelNo} onChange={(value) => patch("specModelNo", value)} />
          <AdminTextField label="Release date" value={draft.specReleaseDate} onChange={(value) => patch("specReleaseDate", value)} />
        </div>
      </section>

      <AdminTextarea
        label="Box items"
        tip="Mỗi dòng là một item trong hộp."
        rows={6}
        value={draft.boxItemsText}
        onChange={(value) => patch("boxItemsText", value)}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <AdminTextField
          label="Đã bán"
          type="number"
          value={draft.sold}
          onChange={(value) => patch("sold", value)}
        />
        <AdminTextField
          label="Rating"
          type="number"
          value={draft.rating}
          onChange={(value) => patch("rating", value)}
        />
        <AdminToggle
          label="Đang hiển thị / active"
          checked={draft.active !== false}
          onChange={(value) => patch("active", value)}
        />
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [lang] = useLang();
  const t = getCopy(lang);

  const [products, setProducts] = useState([]);
  const [reference, setReference] = useState({
    categories: [],
    suppliers: [],
    groups: [],
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [pricePrompt, setPricePrompt] = useState(null);

  async function reload() {
    setLoading(true);
    setApiError("");

    try {
      const [rows, ref] = await Promise.all([
        getAdminProductsFromApi(),
        getAdminCatalogReferenceApi(),
      ]);

      setProducts(Array.isArray(rows) ? rows : []);
      setReference(ref);

      return rows;
    } catch (error) {
      console.error("ADMIN_PRODUCTS_BACKEND_ERROR", error);

      if (error?.status === 401 || error?.message === "Unauthorized") {
        logoutAdmin();
        window.location.href = "/admin/login";
        return [];
      }

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
        product.barcode,
        product.nameVi,
        product.nameEn,
        product.shortVi,
        product.descriptionText,
        product.category?.nameVi,
        product.supplier?.name,
        ...(product.groups || []).map((group) => group.nameVi),
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
      images: products.filter((item) => item.imageUrl || item.images?.length).length,
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

  function buildPayload() {
    const galleryImages = parseGalleryText(draft.galleryText);
    const imageUrl = draft.imageUrl || galleryImages[0] || "";

    const images = Array.from(
      new Set([
        imageUrl,
        ...galleryImages,
      ].filter(Boolean))
    );

    return {
      ...draft,
      price: Number(draft.price || 0),
      oldPrice: Number(draft.oldPrice || 0),
      stock: Number(draft.stock || 0),
      sold: Number(draft.sold || 0),
      rating: Number(draft.rating || 0),
      imageUrl,
      images,
      media: {
        card: imageUrl,
        home: imageUrl,
        detailMain: imageUrl,
        gallery: images,
        hover: imageUrl,
        box: imageUrl,
        image360: draft.image360Url || "",
        video: draft.videoUrl || "",
      },
      specs: [
        { label: "Scale", value: draft.scale || "" },
        { label: "Grade", value: draft.grade || "" },
        { label: "Maker", value: draft.specMaker || draft.brand || "" },
        { label: "Material", value: draft.specMaterial || "" },
        { label: "Difficulty", value: draft.specDifficulty || "" },
        { label: "Height", value: draft.specHeight || "" },
        { label: "Model No.", value: draft.specModelNo || "" },
        { label: "Release date", value: draft.specReleaseDate || "" },
      ].filter((item) => item.value),
      boxItems: parseBoxItemsText(draft.boxItemsText),
      image360Url: draft.image360Url || "",
      videoUrl: draft.videoUrl || "",
    };
  }

  async function save() {
    const payload = buildPayload();
    const isCreate = !payload.id;

    try {
      const saved = payload.id
        ? await updateAdminProductApi(payload.id, payload)
        : await createAdminProductApi(payload);

      setDrawerOpen(false);
      await reload();

      if (isCreate && saved?.id) {
        setPricePrompt(saved);
      }
    } catch (error) {
      alert(error?.message || "Save product failed.");
    }
  }

  function goToPricingNow() {
    if (!pricePrompt?.id) return;
    window.location.href = `/admin/pricing?productId=${encodeURIComponent(pricePrompt.id)}`;
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
      {pricePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              Product pricing required
            </div>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Tạo sản phẩm thành công
            </h2>
            <p className="mt-3 text-sm font-bold leading-6 text-slate-600">
              Bạn cần thiết lập giá bán trước khi sản phẩm hiển thị ngoài storefront.
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-black text-slate-900">{pricePrompt.nameVi || pricePrompt.name?.vi}</div>
              <div className="text-xs font-bold text-slate-500">{pricePrompt.sku}</div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPricePrompt(null)}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={goToPricingNow}
                className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-blue-800"
              >
                Thiết lập giá ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <AdminPageHeader
        eyebrow="Product Information Management"
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

      <section className="mb-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Total products</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.active}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">With images</p>
          <p className="mt-2 text-2xl font-black text-violet-600">{summary.images}</p>
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
          <table className="w-full min-w-[1450px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Actions</th>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU / Slug</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Groups</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center font-bold text-slate-400">
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
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <ImagePlus size={20} className="text-slate-300" />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-black text-slate-950">{product.nameVi}</div>
                      <div className="text-xs font-semibold text-slate-500">{product.nameEn}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {product.brand || "-"} • {product.grade || "-"} • {product.scale || "-"}
                      </div>
                      <div className="mt-1 text-xs font-bold text-violet-600">
                        {(product.images || []).length} image(s)
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold">{product.sku}</div>
                      <div className="text-xs text-slate-500">{product.slug}</div>
                    </td>

                    <td className="px-4 py-3">
                      {product.category ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
                          {product.category.nameVi}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-slate-600">
                      {product.supplier?.name || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex max-w-[240px] flex-wrap gap-1">
                        {(product.groups || []).length ? (
                          product.groups.map((group) => (
                            <span key={group.id} className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-black text-violet-700">
                              {group.nameVi}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-black text-red-500">{formatCurrency(product.price)}</div>
                      {Number(product.oldPrice || 0) > Number(product.price || 0) && (
                        <div className="text-xs font-bold text-slate-400 line-through">{formatCurrency(product.oldPrice)}</div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-black">{product.stock}</td>

                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${
                          product.active !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {product.status || "inStock"}
                      </div>
                      <div className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                        DB PRODUCT
                      </div>
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
        <ProductForm draft={draft} setDraft={setDraft} reference={reference} />
      </AdminDrawer>
    </>
  );
}
