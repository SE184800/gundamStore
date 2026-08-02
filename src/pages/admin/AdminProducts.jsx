import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Edit3, ImagePlus, MoreVertical, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
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
  commitAdminProductImportCsv,
  createAdminProductApi,
  deleteAdminProductApi,
  downloadAdminProductImportTemplateCsv,
  exportAdminProductsCsv,
  getAdminCatalogReferenceApi,
  getAdminProductsFromApi,
  previewAdminProductImportCsv,
  updateAdminProductApi,
} from "../../services/AdminProductApiService";
import { uploadAdminProductImages } from "../../services/AdminMediaApiService";
import useToast from "../../hooks/useToast";
import Toast from "../../utils/Toast";

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
  variants: [],
};

const STATUS_OPTIONS = [
  { value: "inStock", label: "Hàng sẵn / In stock" },
  { value: "preorder", label: "Pre-order" },
  { value: "sale", label: "Sale (legacy - use Promotion)" },
  { value: "comingSoon", label: "Coming soon" },
  { value: "outOfStock", label: "Hết hàng / Out of stock" },
  { value: "draft", label: "Draft / Nháp" },
  { value: "inactive", label: "Inactive" },
];

const TONE_OPTIONS = ["blue", "cyan", "sky", "red", "gold", "slate", "violet"];

function getProductTabs(lang) {
  return [
    { id: "all", label: lang === "en" ? "All" : "Tất cả" },
    { id: "selling", label: lang === "en" ? "Selling" : "Đang bán" },
    { id: "outOfStock", label: lang === "en" ? "Out of stock" : "Hết hàng" },
    { id: "missingPrice", label: lang === "en" ? "Missing price" : "Thiếu giá" },
    { id: "draft", label: lang === "en" ? "Draft" : "Nháp" },
    { id: "hidden", label: lang === "en" ? "Hidden" : "Đã ẩn" },
    { id: "dataIssue", label: lang === "en" ? "Data issue" : "Lỗi dữ liệu" },
  ];
}

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
    colActions: lang === "en" ? "Actions" : "Thao tác",
    colImage: lang === "en" ? "Image" : "Hình ảnh",
    colProduct: lang === "en" ? "Product" : "Sản phẩm",
    colSkuSlug: lang === "en" ? "SKU / Slug" : "SKU / Slug",
    colCategory: lang === "en" ? "Category" : "Danh mục",
    colSupplier: lang === "en" ? "Supplier" : "Nhà cung cấp",
    colGroups: lang === "en" ? "Groups" : "Nhóm",
    colPrice: lang === "en" ? "Price" : "Giá",
    colStock: lang === "en" ? "Stock" : "Tồn kho",
    colStatus: lang === "en" ? "Status" : "Trạng thái",
    loadingProducts: lang === "en" ? "Loading backend products..." : "Đang tải sản phẩm...",
    actionEdit: lang === "en" ? "Edit" : "Sửa",
    actionSetPrice: lang === "en" ? "Set price" : "Đặt giá",
    actionSetDiscount: lang === "en" ? "Set discount" : "Đặt khuyến mãi",
    actionAdjustStock: lang === "en" ? "Adjust stock" : "Điều chỉnh tồn kho",
    actionPreview: lang === "en" ? "Preview" : "Xem trước",
    actionPublish: lang === "en" ? "Publish" : "Xuất bản",
    actionUnpublish: lang === "en" ? "Unpublish" : "Ẩn sản phẩm",
    actionDelete: lang === "en" ? "Delete permanently" : "Xóa vĩnh viễn",
    moreActions: lang === "en" ? "More actions" : "Thêm thao tác",
    loading: lang === "en" ? "Loading..." : "Đang tải...",
    eyebrow: lang === "en" ? "Product Information Management" : "Quản lý thông tin sản phẩm",
    statTotal: lang === "en" ? "Total products" : "Tổng sản phẩm",
    statActive: lang === "en" ? "Active" : "Đang bán",
    statWithImages: lang === "en" ? "With images" : "Có hình ảnh",
    statStock: lang === "en" ? "Stock" : "Tồn kho",
    statInventoryValue: lang === "en" ? "Inventory value" : "Giá trị tồn kho",
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

    variants: Array.isArray(product.variants)
      ? product.variants.map((variant, index) => ({
        id: variant.id || "",
        sku: variant.sku || "",
        barcode: variant.barcode || "",
        nameVi: variant.nameVi || "",
        nameEn: variant.nameEn || variant.nameVi || "",
        option1Name: variant.option1Name || "",
        option1Value: variant.option1Value || "",
        option2Name: variant.option2Name || "",
        option2Value: variant.option2Value || "",
        price: Number(variant.price || 0),
        oldPrice: Number(variant.oldPrice || 0),
        stock: Number(variant.stock || 0),
        imageUrl: variant.imageUrl || "",
        active: variant.active !== false,
        status: variant.status || "inStock",
        sortOrder: Number(variant.sortOrder ?? index),
      }))
      : [],

    specsText: formatSpecsText(product.specs),
    boxItemsText: formatBoxItemsText(product.boxItems),
  };
}

function createEmptyVariant(index = 0, parentSku = "") {
  return {
    id: "",
    sku: parentSku ? `${parentSku}-VAR-${index + 1}` : "",
    barcode: "",
    nameVi: "",
    nameEn: "",
    option1Name: "Version",
    option1Value: "",
    option2Name: "",
    option2Value: "",
    price: 0,
    oldPrice: 0,
    stock: 0,
    imageUrl: "",
    active: true,
    status: "inStock",
    sortOrder: index,
  };
}

function VariantEditor({ draft, setDraft }) {
  const variants = Array.isArray(draft.variants) ? draft.variants : [];

  function patchVariant(index, field, value) {
    setDraft((prev) => {
      const nextVariants = [...(prev.variants || [])];
      nextVariants[index] = {
        ...nextVariants[index],
        [field]: value,
      };
      return { ...prev, variants: nextVariants };
    });
  }

  function addVariant() {
    setDraft((prev) => {
      const next = [...(prev.variants || []), createEmptyVariant((prev.variants || []).length, prev.sku)];
      return { ...prev, variants: next };
    });
  }

  function deactivateVariant(index) {
    setDraft((prev) => {
      const nextVariants = [...(prev.variants || [])];
      const current = nextVariants[index] || {};
      nextVariants[index] = {
        ...current,
        active: false,
        status: "inactive",
      };
      return { ...prev, variants: nextVariants };
    });
  }

  function removeNewVariant(index) {
    setDraft((prev) => {
      const nextVariants = [...(prev.variants || [])];
      const current = nextVariants[index];

      if (current?.id) {
        nextVariants[index] = {
          ...current,
          active: false,
          status: "inactive",
        };
      } else {
        nextVariants.splice(index, 1);
      }

      return { ...prev, variants: nextVariants };
    });
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-blue-900">Variants / Phân loại hàng</div>
          <p className="mt-1 text-xs font-semibold text-blue-800/80">
            Mỗi variant có SKU, giá, tồn kho và ảnh riêng. Product parent chỉ đóng vai trò grouping/display.
          </p>
        </div>
        <button
          type="button"
          onClick={addVariant}
          className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
        >
          + Add variant
        </button>
      </div>

      {!variants.length && (
        <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-white/70 p-4 text-center text-xs font-bold text-blue-700">
          Chưa có variant. Product sẽ bán theo SKU/giá/tồn kho của parent như hiện tại.
        </div>
      )}

      <div className="mt-4 space-y-4">
        {variants.map((variant, index) => (
          <div
            key={variant.id || index}
            className={`rounded-3xl border bg-white p-4 shadow-sm ${variant.active === false ? "border-slate-200 opacity-60" : "border-blue-100"
              }`}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Variant #{index + 1}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => deactivateVariant(index)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                >
                  Unpublish
                </button>
                <button
                  type="button"
                  onClick={() => removeNewVariant(index)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-600 hover:bg-red-100"
                >
                  {variant.id ? "Deactivate" : "Remove"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <AdminTextField label="Variant SKU" required value={variant.sku} onChange={(value) => patchVariant(index, "sku", value)} />
              <AdminTextField label="Variant barcode" value={variant.barcode} onChange={(value) => patchVariant(index, "barcode", value)} />
              <AdminTextField label="Sort order" type="number" value={variant.sortOrder} onChange={(value) => patchVariant(index, "sortOrder", value)} />
              <AdminTextField label="Variant name VI" required value={variant.nameVi} onChange={(value) => patchVariant(index, "nameVi", value)} />
              <AdminTextField label="Variant name EN" value={variant.nameEn} onChange={(value) => patchVariant(index, "nameEn", value)} />
              <AdminSelect label="Status" options={STATUS_OPTIONS} value={variant.status} onChange={(value) => patchVariant(index, "status", value)} />
              <AdminTextField label="Option 1 name" value={variant.option1Name} onChange={(value) => patchVariant(index, "option1Name", value)} />
              <AdminTextField label="Option 1 value" value={variant.option1Value} onChange={(value) => patchVariant(index, "option1Value", value)} />
              <AdminTextField label="Option 2 name" value={variant.option2Name} onChange={(value) => patchVariant(index, "option2Name", value)} />
              <AdminTextField label="Option 2 value" value={variant.option2Value} onChange={(value) => patchVariant(index, "option2Value", value)} />
              <AdminTextField label="Variant price" type="number" suffix="đ" value={variant.price} onChange={(value) => patchVariant(index, "price", value)} />
              <AdminTextField label="Variant old price" type="number" suffix="đ" value={variant.oldPrice} onChange={(value) => patchVariant(index, "oldPrice", value)} />
              <AdminTextField label="Variant stock" type="number" value={variant.stock} onChange={(value) => patchVariant(index, "stock", value)} />
            </div>

            <div className="mt-4">
              <AdminImageUploader
                label="Variant image"
                value={variant.imageUrl}
                onChange={(value) => patchVariant(index, "imageUrl", value)}
                recommended="1200 x 1200 px"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
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
        <div className="text-sm font-black text-amber-800">Seller price & stock readiness</div>
        <p className="mt-1 text-xs font-semibold text-amber-700/80">
          Sản phẩm chỉ được publish ra storefront khi có giá bán &gt; 0 và có tồn kho, hoặc đang ở trạng thái preorder.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AdminTextField
            label="Initial selling price"
            type="number"
            suffix="đ"
            value={draft.price}
            onChange={(value) => patch("price", value)}
          />
          <AdminTextField
            label="Compare at / Old price"
            type="number"
            suffix="đ"
            value={draft.oldPrice}
            onChange={(value) => patch("oldPrice", value)}
          />
          <AdminTextField
            label="Initial stock"
            type="number"
            value={draft.stock}
            onChange={(value) => patch("stock", value)}
          />
        </div>

        <div className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-xs font-bold text-amber-800">
          Pricing Center vẫn là nơi quản lý ProductPrice/history chính thức. Section này giúp tạo sản phẩm mới theo flow seller center và tránh publish sản phẩm giá 0đ.
        </div>
      </div>

      <VariantEditor draft={draft} setDraft={setDraft} />

      <PublishReadinessChecklist draft={draft} />

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

const PRODUCT_ISSUE_LABELS = {
  SKU: "Missing SKU",
  "Tên": "Missing product name",
  "Danh mục": "Missing category",
  "Ảnh": "Missing image",
  "Giá": "Missing price",
  "Tồn kho": "Missing stock",
  Variant: "Missing sellable variant",
};

function getProductIssueDisplay(product = {}) {
  return getProductIssueStatus(product).map((issue) => PRODUCT_ISSUE_LABELS[issue] || `Missing ${issue}`);
}

function allowsNoStockForCommercialStatus(status = "") {
  const normalized = String(status || "").toLowerCase();
  return normalized.includes("pre") || normalized.includes("coming");
}

function getActiveProductVariants(product = {}) {
  return (Array.isArray(product.variants) ? product.variants : [])
    .filter((variant) => {
      const status = String(variant?.status || "").toLowerCase();
      return variant && variant.active !== false && status !== "inactive";
    });
}

function isProductVariantSellable(variant = {}) {
  const status = String(variant.status || "").toLowerCase();

  return (
    variant.active !== false &&
    !["inactive", "draft"].includes(status) &&
    Number(variant.price || 0) > 0 &&
    (Number(variant.stock || 0) > 0 || allowsNoStockForCommercialStatus(variant.status))
  );
}

function hasProductVariants(product = {}) {
  return getActiveProductVariants(product).length > 0;
}

function hasSellableProductVariant(product = {}) {
  return getActiveProductVariants(product).some(isProductVariantSellable);
}

function getPublishChecklistItems(product = {}) {
  const status = String(product.status || "").toLowerCase();
  const allowNoStock = allowsNoStockForCommercialStatus(status);
  const hasVariants = hasProductVariants(product);
  const hasSellableVariant = hasSellableProductVariant(product);

  const common = [
    {
      key: "sku",
      label: "SKU",
      ok: Boolean(product.sku),
      missing: "Missing SKU",
    },
    {
      key: "name",
      label: "Product name",
      ok: Boolean(product.nameVi || product.name?.vi),
      missing: "Missing product name",
    },
    {
      key: "category",
      label: "Category",
      ok: Boolean(product.categoryId || product.category?.id),
      missing: "Missing category",
    },
    {
      key: "image",
      label: "Main image",
      ok: Boolean(product.imageUrl || product.images?.length),
      missing: "Missing image",
    },
  ];

  const commercial = hasVariants
    ? [
      {
        key: "variant",
        label: "At least 1 sellable variant",
        ok: hasSellableVariant,
        missing: "Missing sellable variant",
      },
    ]
    : [
      {
        key: "price",
        label: "Selling price > 0",
        ok: Number(product.price || 0) > 0,
        missing: "Missing price",
      },
      {
        key: "stock",
        label: "Stock > 0 or Pre-order / Coming soon",
        ok: Number(product.stock || 0) > 0 || allowNoStock,
        missing: "Missing stock",
      },
    ];

  return [
    ...common,
    ...commercial,
    {
      key: "publish",
      label: "Active / Publish status",
      ok: product.active !== false && !["draft", "inactive"].includes(status),
      missing: "Draft / Inactive",
      optional: true,
    },
  ];
}

function isPublishReady(product = {}) {
  return getPublishChecklistItems(product)
    .filter((item) => !item.optional)
    .every((item) => item.ok);
}

function PublishReadinessChecklist({ draft }) {
  const items = getPublishChecklistItems(draft);
  const ready = isPublishReady(draft);

  return (
    <section className={`rounded-3xl border p-4 ${ready ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"
      }`}>
      <div className={`text-sm font-black ${ready ? "text-emerald-800" : "text-amber-800"}`}>
        Publish readiness checklist
      </div>
      <p className={`mt-1 text-xs font-semibold ${ready ? "text-emerald-700/80" : "text-amber-700/80"}`}>
        {ready
          ? "Sản phẩm đủ điều kiện publish và hiển thị ngoài storefront."
          : "Sản phẩm sẽ được lưu dạng Draft/Inactive và chưa hiển thị ngoài storefront nếu thiếu điều kiện bắt buộc."}
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-2xl px-3 py-2 text-xs font-black ${item.ok
                ? "bg-white text-emerald-700"
                : item.optional
                  ? "bg-white text-slate-500"
                  : "bg-red-50 text-red-600"
              }`}
          >
            <span>{item.label}</span>
            <span>{item.ok ? "✓ Ready" : item.missing}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function getProductIssueStatus(product = {}) {
  const missing = [];
  const hasVariants = hasProductVariants(product);

  if (!product.sku) missing.push("SKU");
  if (!product.nameVi && !product.name?.vi) missing.push("Tên");
  if (!product.categoryId && !product.category?.id) missing.push("Danh mục");
  if (!product.imageUrl && !product.images?.length) missing.push("Ảnh");

  if (hasVariants) {
    if (!hasSellableProductVariant(product)) missing.push("Variant");
  } else {
    if (Number(product.price || 0) <= 0) missing.push("Giá");
    if (Number(product.stock || 0) <= 0 && !allowsNoStockForCommercialStatus(product.status)) missing.push("Tồn kho");
  }

  return missing;
}

function isSellingProduct(product = {}) {
  const status = String(product.status || "").toLowerCase();

  if (
    product.active === false ||
    ["inactive", "draft"].includes(status)
  ) {
    return false;
  }

  if (hasProductVariants(product)) {
    return hasSellableProductVariant(product);
  }

  return (
    Number(product.price || 0) > 0 &&
    (Number(product.stock || 0) > 0 || allowsNoStockForCommercialStatus(product.status))
  );
}

function getProductTabMatch(product = {}, tab = "all") {
  const issues = getProductIssueStatus(product);
  const status = String(product.status || "").toLowerCase();

  if (tab === "all") return true;
  if (tab === "selling") return isSellingProduct(product);
  if (tab === "outOfStock") return Number(product.stock || 0) <= 0 && !allowsNoStockForCommercialStatus(status);
  if (tab === "missingPrice") {
    return hasProductVariants(product)
      ? !hasSellableProductVariant(product)
      : Number(product.price || 0) <= 0;
  }
  if (tab === "draft") return status === "draft" || status === "inactive";
  if (tab === "hidden") return product.active === false;
  if (tab === "dataIssue") return issues.length > 0;

  return true;
}

function parseBulkCsvLine(line = "") {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function getBulkCsvSkus(csvText = "") {
  const lines = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) return [];

  const headers = parseBulkCsvLine(lines[0]).map((value) => value.toLowerCase());
  const skuIndex = headers.indexOf("sku");
  if (skuIndex < 0) return [];

  return Array.from(new Set(
    lines
      .slice(1)
      .map((line) => String(parseBulkCsvLine(line)[skuIndex] || "").trim().toUpperCase())
      .filter(Boolean)
  )).sort((a, b) => b.length - a.length);
}

function imageStem(filename = "") {
  return String(filename || "")
    .replace(/\.[^.]+$/, "")
    .trim()
    .toUpperCase();
}

function imageOrderForSku(file, sku) {
  const stem = imageStem(file?.name);
  if (stem === sku) return 0;
  const suffix = stem.slice(sku.length).replace(/^[-_]/, "");
  const number = Number(String(suffix).match(/\d+/)?.[0] || 999);
  return Number.isFinite(number) ? number : 999;
}

function matchBulkImagesToSkus(csvText = "", selectedFiles = []) {
  const skus = getBulkCsvSkus(csvText);
  const bySku = new Map();
  const unmatched = [];
  const oversized = [];

  for (const file of Array.from(selectedFiles || [])) {
    if (!String(file?.type || "").startsWith("image/")) {
      unmatched.push(file);
      continue;
    }

    if (Number(file.size || 0) > 10 * 1024 * 1024) {
      oversized.push(file);
      continue;
    }

    const stem = imageStem(file.name);
    const sku = skus.find((item) => stem === item || stem.startsWith(`${item}-`) || stem.startsWith(`${item}_`));

    if (!sku) {
      unmatched.push(file);
      continue;
    }

    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push(file);
  }

  const overLimit = [];

  for (const [sku, files] of bySku.entries()) {
    files.sort((a, b) => imageOrderForSku(a, sku) - imageOrderForSku(b, sku) || a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (files.length > 6) {
      overLimit.push({ sku, count: files.length });
      bySku.set(sku, files.slice(0, 6));
    }
  }

  return {
    bySku,
    imageSkus: Array.from(bySku.keys()),
    matchedFiles: Array.from(bySku.values()).reduce((sum, files) => sum + files.length, 0),
    unmatched,
    oversized,
    overLimit,
  };
}

function ProductBulkImportExportPanel({ onImported }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("upsert");
  const [csvText, setCsvText] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const imageMatch = useMemo(
    () => matchBulkImagesToSkus(csvText, imageFiles),
    [csvText, imageFiles]
  );

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && !file.type.includes("csv")) {
      notify("error", "Vui lòng chọn file CSV. File này có thể mở và chỉnh sửa trực tiếp bằng Excel.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("error", "File CSV quá lớn. Dung lượng tối đa 2MB.");
      event.target.value = "";
      return;
    }

    const text = await file.text();
    setCsvText(text);
    setPreview(null);
    setMessage(`Đã đọc file ${file.name}`);
  }

  function handleImageFiles(event) {
    const files = Array.from(event.target.files || []);
    setImageFiles(files);
    setPreview(null);
    setMessage(files.length ? `Đã chọn ${files.length} ảnh. Hệ thống sẽ ghép theo SKU.` : "");
  }

  async function previewImport() {
    if (imageMatch.oversized.length) {
      setMessage(`Có ${imageMatch.oversized.length} ảnh lớn hơn 10MB. Vui lòng giảm dung lượng trước khi tiếp tục.`);
      return;
    }

    if (imageMatch.overLimit.length) {
      setMessage(`Mỗi sản phẩm tối đa 6 ảnh. Vui lòng giảm ảnh của: ${imageMatch.overLimit.map((item) => `${item.sku} (${item.count})`).join(", ")}.`);
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const result = await previewAdminProductImportCsv(csvText, {
        mode,
        imageSkus: imageMatch.imageSkus,
      });
      setPreview(result);
      setMessage(
        `Preview: ${result.validRows}/${result.totalRows} dòng hợp lệ; tạo ${result.createRows || 0}; cập nhật ${result.updateRows || 0}; bỏ qua ${result.skippedRows || 0}.`
      );
    } catch (error) {
      setMessage(error?.message || "Preview thất bại.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadMatchedProductImages(importedProducts = []) {
    const productBySku = new Map(
      (importedProducts || []).map((product) => [String(product.sku || "").toUpperCase(), product])
    );
    let uploadedProducts = 0;
    let uploadedImages = 0;
    const failures = [];

    for (const [sku, files] of imageMatch.bySku.entries()) {
      const product = productBySku.get(sku);

      if (!product?.id) {
        continue;
      }

      try {
        await uploadAdminProductImages(product.id, files, { replace: true });
        uploadedProducts += 1;
        uploadedImages += files.length;
      } catch (error) {
        failures.push(`${sku}: ${error?.message || "upload failed"}`);
      }
    }

    return { uploadedProducts, uploadedImages, failures };
  }

  async function commitImport() {
    if (!preview) {
      notify("error", "Vui lòng bấm Preview trước khi Commit.");
      return;
    }

    if (preview.errorRows > 0) {
      notify("error", "File còn dòng lỗi. Vui lòng sửa CSV rồi Preview lại.");
      return;
    }

    if (!window.confirm(`Xác nhận import theo chế độ: ${mode}?`)) return;

    setBusy(true);
    setMessage("");

    try {
      const result = await commitAdminProductImportCsv(csvText, mode, imageMatch.imageSkus);
      const uploadResult = await uploadMatchedProductImages(result.products || []);
      const baseMessage = `Import xong: tạo ${result.created}, cập nhật ${result.updated}, variants ${result.variants}, bỏ qua ${result.skipped}. Ảnh: ${uploadResult.uploadedImages} ảnh cho ${uploadResult.uploadedProducts} sản phẩm.`;

      if (uploadResult.failures.length) {
        setMessage(`${baseMessage}\nẢnh lỗi:\n${uploadResult.failures.join("\n")}`);
      } else {
        setMessage(baseMessage);
        setCsvText("");
        setImageFiles([]);
      }

      setPreview(null);
      await onImported?.();
    } catch (error) {
      const details = error?.data?.errorRows?.slice?.(0, 5)?.map((row) => `Dòng ${row.line}: ${row.errors.join("; ")}`).join("\n");
      setMessage(details || error?.message || "Commit thất bại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-4 rounded-3xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-black text-blue-900">Tạo / cập nhật hàng loạt sản phẩm</div>
          <p className="mt-1 text-sm font-semibold text-blue-800/80">
            Import CSV bằng Excel, cập nhật theo SKU và upload nhiều ảnh tự động lên Supabase.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadAdminProductImportTemplateCsv()}
            className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-50"
          >
            Tải file mẫu
          </button>
          <button
            type="button"
            onClick={() => void exportAdminProductsCsv()}
            className="rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-50"
          >
            Xuất sản phẩm
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-2xl bg-blue-700 px-4 py-2 text-xs font-black text-white hover:bg-blue-800"
          >
            {open ? "Đóng import" : "Nhập hàng loạt"}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800">
            Tên ảnh: <b>SKU.jpg</b> là ảnh chính; <b>SKU-2.jpg</b>, <b>SKU-3.jpg</b> là ảnh gallery. Tối đa 6 ảnh/sản phẩm và 10MB/ảnh.
            Khi update, ô trống trong CSV sẽ giữ nguyên dữ liệu cũ. Dùng <b>__CLEAR__</b> tại cột groupCodes nếu muốn xóa toàn bộ group.
          </div>

          <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase text-slate-500">Chế độ import</label>
              <select
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value);
                  setPreview(null);
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none"
              >
                <option value="create">Chỉ tạo sản phẩm mới</option>
                <option value="update">Chỉ cập nhật theo SKU</option>
                <option value="upsert">Có thì cập nhật, chưa có thì tạo</option>
              </select>

              <label className="block text-xs font-black text-slate-600">
                1. Chọn file CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFile}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-600"
                />
              </label>

              <label className="block text-xs font-black text-slate-600">
                2. Chọn nhiều ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageFiles}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-600"
                />
              </label>

              <label className="block text-xs font-black text-slate-600">
                Hoặc chọn cả thư mục ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  webkitdirectory=""
                  directory=""
                  onChange={handleImageFiles}
                  className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs font-bold text-slate-600"
                />
              </label>

              <div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">
                <div>Sản phẩm có ảnh khớp: <b>{imageMatch.imageSkus.length}</b></div>
                <div>Số ảnh sẽ upload: <b>{imageMatch.matchedFiles}</b></div>
                <div className={imageMatch.unmatched.length ? "text-amber-700" : ""}>Ảnh chưa khớp SKU: <b>{imageMatch.unmatched.length}</b></div>
                <div className={imageMatch.oversized.length ? "text-red-600" : ""}>Ảnh trên 10MB: <b>{imageMatch.oversized.length}</b></div>
              </div>

              {imageMatch.unmatched.length > 0 && (
                <div className="max-h-28 overflow-auto rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-bold text-amber-800">
                  Chưa khớp: {imageMatch.unmatched.slice(0, 12).map((file) => file.name).join(", ")}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || !csvText.trim()}
                  onClick={() => void previewImport()}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  {busy ? "Đang xử lý..." : "Xem trước"}
                </button>
                <button
                  type="button"
                  disabled={busy || !preview || preview.errorRows > 0}
                  onClick={() => void commitImport()}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                >
                  Xác nhận nhập
                </button>
              </div>
            </div>

            <div>
              <textarea
                value={csvText}
                onChange={(event) => {
                  setCsvText(event.target.value);
                  setPreview(null);
                }}
                placeholder="Nội dung CSV sẽ hiển thị tại đây..."
                className="h-52 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs outline-none focus:border-blue-300 focus:bg-white"
              />

              {message && (
                <div className="mt-3 whitespace-pre-line rounded-2xl bg-blue-50 p-3 text-xs font-black text-blue-700">
                  {message}
                </div>
              )}

              {preview && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 text-xs font-black text-slate-600 md:grid-cols-5">
                    <div>Tổng: {preview.totalRows}</div>
                    <div className="text-emerald-600">Hợp lệ: {preview.validRows}</div>
                    <div className="text-blue-600">Tạo: {preview.createRows || 0}</div>
                    <div className="text-violet-600">Cập nhật: {preview.updateRows || 0}</div>
                    <div className="text-red-600">Lỗi: {preview.errorRows}</div>
                  </div>

                  <div className="max-h-72 overflow-auto">
                    {(preview.rows || []).slice(0, 80).map((row) => (
                      <div key={`${row.line}-${row.sku}-${row.variantSku}`} className="grid gap-2 border-t border-slate-100 p-3 text-xs md:grid-cols-[70px_1fr_1fr_1fr]">
                        <div className="font-black text-slate-500">Dòng {row.line}</div>
                        <div>
                          <div className="font-black text-slate-900">{row.sku}</div>
                          <div className="text-[10px] font-bold uppercase text-blue-600">{row.action}</div>
                        </div>
                        <div className="text-slate-600">{row.hasUploadedImages ? "Có ảnh theo SKU" : row.variantSku || "Sản phẩm chính"}</div>
                        <div className={row.valid ? "font-black text-emerald-600" : "font-black text-red-600"}>
                          {row.valid ? "Hợp lệ" : row.errors.join("; ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function AdminProducts() {
  const { toast, notify, dismiss } = useToast();
  const [lang] = useLang();
  const t = getCopy(lang);

  const [products, setProducts] = useState([]);
  const [reference, setReference] = useState({
    categories: [],
    suppliers: [],
    groups: [],
  });
  const [query, setQuery] = useState("");
  const [productTab, setProductTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [openActionsId, setOpenActionsId] = useState(null);
  const [actionsMenuPos, setActionsMenuPos] = useState(null);
  const actionsMenuRef = useRef(null);
  const actionsTriggerRef = useRef(null);

  function closeActionsMenu() {
    setOpenActionsId(null);
    setActionsMenuPos(null);
  }

  function toggleActionsMenu(event, productId) {
    if (openActionsId === productId) {
      closeActionsMenu();
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setActionsMenuPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 208) });
    setOpenActionsId(productId);
  }

  useEffect(() => {
    if (!openActionsId) return undefined;

    function handleClickOutside(event) {
      const insideMenu = actionsMenuRef.current && actionsMenuRef.current.contains(event.target);
      const insideTrigger = actionsTriggerRef.current && actionsTriggerRef.current.contains(event.target);
      if (!insideMenu && !insideTrigger) closeActionsMenu();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", closeActionsMenu, true);
    window.addEventListener("resize", closeActionsMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", closeActionsMenu, true);
      window.removeEventListener("resize", closeActionsMenu);
    };
  }, [openActionsId]);
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

      // Keep whatever products are already on screen instead of wiping the
      // list to empty on a transient refresh failure.
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

    return products
      .filter((product) => getProductTabMatch(product, productTab))
      .filter((product) => {
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
  }, [products, query, productTab]);

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

    const payload = {
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

    const wantsPublish =
      payload.active !== false &&
      !["inactive", "draft"].includes(String(payload.status || "").toLowerCase());

    const issues = getProductIssueStatus(payload);

    if (wantsPublish && issues.length) {
      payload.active = false;
      payload.status = "draft";
      payload.publishBlockedReason = `Missing required data: ${issues.join(", ")}`;
    }

    if (Number(payload.price || 0) <= 0 && !hasSellableProductVariant(payload)) {
      payload.active = false;
      payload.status = "draft";
    }

    return payload;
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

      if (isCreate && saved?.id && Number(saved.price || 0) <= 0 && !hasSellableProductVariant(saved)) {
        setPricePrompt(saved);
      }
    } catch (error) {
      notify("error", error?.message || "Save product failed.");
    }
  }

  function goToPricingNow() {
    if (!pricePrompt?.id) return;
    window.location.href = `/admin/pricing?productId=${encodeURIComponent(pricePrompt.id)}`;
  }

  function goToProductPricing(product) {
    if (!product?.id) return;
    window.location.href = `/admin/pricing?productId=${encodeURIComponent(product.id)}`;
  }

  function goToProductPromotion(product) {
    if (!product?.id) return;
    window.location.href = `/admin/promotions?productId=${encodeURIComponent(product.id)}`;
  }

  function goToProductInventory(product) {
    if (!product?.id) return;
    window.location.href = `/admin/inventory?productId=${encodeURIComponent(product.id)}`;
  }

  function previewProduct(product) {
    const slug = product?.slug || product?.id;
    if (!slug) return;
    window.open(`/product/${slug}`, "_blank", "noopener,noreferrer");
  }

  async function toggleProductPublish(product) {
    const shouldPublish =
      product.active === false ||
      ["inactive", "draft"].includes(String(product.status || "").toLowerCase());

    const issues = getProductIssueStatus(product);

    if (shouldPublish && issues.length) {
      notify("error", `Không thể publish. Thiếu: ${issues.join(", ")}`);
      return;
    }

    const next = {
      ...product,
      active: shouldPublish,
      status: shouldPublish ? "inStock" : "inactive",
    };

    try {
      await updateAdminProductApi(product.id, next);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Update publish status failed.");
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm ${product.sku}? Sản phẩm đã có đơn hàng, phiếu nhập hoặc đánh giá sẽ được backend chặn.`)) return;

    try {
      await deleteAdminProductApi(product.id);
      await reload();
    } catch (error) {
      notify("error", error?.message || "Xóa sản phẩm thất bại.");
    }
  }

  return (
    <>
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={dismiss} />
      {pricePrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 p-4">
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
        eyebrow={t.eyebrow}
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

      {/* <section className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="text-sm font-black text-emerald-800">{t.backendSource}</div>
        <p className="mt-1 text-sm font-semibold text-emerald-700/80">{t.backendDesc}</p>
      </section> */}

      <ProductBulkImportExportPanel onImported={reload} />

      {apiError && (
        <section className="mb-4 rounded-3xl border border-red-100 bg-red-50 p-4">
          <div className="text-sm font-black text-red-700">{t.loadError}</div>
          <p className="mt-1 text-sm font-semibold text-red-700/80">{apiError}</p>
        </section>
      )}

      <section className="mb-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.statTotal}</p>
          <p className="mt-2 text-2xl font-black">{summary.total}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.statActive}</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{summary.active}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.statWithImages}</p>
          <p className="mt-2 text-2xl font-black text-violet-600">{summary.images}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.statStock}</p>
          <p className="mt-2 text-2xl font-black text-blue-600">{summary.stock}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-400">{t.statInventoryValue}</p>
          <p className="mt-2 text-2xl font-black text-red-500">{formatCurrency(summary.inventoryValue)}</p>
        </div>
      </section>

      <section className="mb-4 rounded-md border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {getProductTabs(lang).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setProductTab(tab.id)}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${productTab === tab.id
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
            {loading ? t.loading : t.refresh}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t.colActions}</th>
                <th className="px-4 py-3">{t.colImage}</th>
                <th className="px-4 py-3">{t.colProduct}</th>
                <th className="px-4 py-3">{t.colSkuSlug}</th>
                <th className="px-4 py-3">{t.colCategory}</th>
                <th className="px-4 py-3">{t.colSupplier}</th>
                <th className="px-4 py-3">{t.colGroups}</th>
                <th className="px-4 py-3 text-right">{t.colPrice}</th>
                <th className="px-4 py-3 text-right">{t.colStock}</th>
                <th className="px-4 py-3">{t.colStatus}</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center font-bold text-slate-400">
                    {loading ? t.loadingProducts : t.noRows}
                  </td>
                </tr>
              ) : (
                rows.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex min-w-[140px] items-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 size={14} className="mr-1 inline" />
                          {t.actionEdit}
                        </button>

                        <button
                          type="button"
                          ref={openActionsId === product.id ? actionsTriggerRef : null}
                          onClick={(event) => toggleActionsMenu(event, product.id)}
                          className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50"
                          aria-label={t.moreActions}
                          title={t.moreActions}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {openActionsId === product.id && actionsMenuPos && createPortal(
                          <div
                            ref={actionsMenuRef}
                            style={{ position: "fixed", top: actionsMenuPos.top, left: actionsMenuPos.left }}
                            className="z-50 w-52 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => { goToProductPricing(product); closeActionsMenu(); }}
                              className="block w-full px-3 py-2 text-left text-xs font-black text-blue-700 hover:bg-blue-50"
                            >
                              {t.actionSetPrice}
                            </button>
                            <button
                              type="button"
                              onClick={() => { goToProductPromotion(product); closeActionsMenu(); }}
                              className="block w-full px-3 py-2 text-left text-xs font-black text-fuchsia-700 hover:bg-fuchsia-50"
                            >
                              {t.actionSetDiscount}
                            </button>
                            <button
                              type="button"
                              onClick={() => { goToProductInventory(product); closeActionsMenu(); }}
                              className="block w-full px-3 py-2 text-left text-xs font-black text-amber-700 hover:bg-amber-50"
                            >
                              {t.actionAdjustStock}
                            </button>
                            <button
                              type="button"
                              onClick={() => { previewProduct(product); closeActionsMenu(); }}
                              className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              {t.actionPreview}
                            </button>
                            <button
                              type="button"
                              onClick={() => { void toggleProductPublish(product); closeActionsMenu(); }}
                              className="block w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                            >
                              {product.active === false || ["inactive", "draft"].includes(String(product.status || "").toLowerCase())
                                ? t.actionPublish
                                : t.actionUnpublish}
                            </button>
                            <button
                              type="button"
                              onClick={() => { void removeProduct(product); closeActionsMenu(); }}
                              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={13} className="mr-1 inline" />
                              {t.actionDelete}
                            </button>
                          </div>,
                          document.body
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
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

                      {/* DATA_ISSUE_BADGES_IN_PRODUCT_LIST */}
                      <div className="mt-2 flex max-w-[260px] flex-wrap gap-1">
                        {getProductIssueDisplay(product).length > 0 ? (
                          getProductIssueDisplay(product).map((issue) => (
                            <span
                              key={issue}
                              className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600"
                            >
                              {issue}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                            Ready
                          </span>
                        )}
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
                        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${product.active !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {product.status || "inStock"}
                      </div>
                      <div className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                        DB PRODUCT
                      </div>

                      {getProductIssueStatus(product).length > 0 && (
                        <div className="mt-2 flex max-w-[180px] flex-wrap gap-1">
                          {getProductIssueStatus(product).map((issue) => (
                            <span key={issue} className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                              Missing {issue}
                            </span>
                          ))}
                        </div>
                      )}
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
