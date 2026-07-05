import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import {
  getStorefrontCategoriesFromApi,
  getStorefrontProductsForStorefront,
} from "../../services/StorefrontProductApiService";

const text = {
  vi: {
    home: "Trang chủ",
    shopPage: "Trang bán hàng",
    title: "Tất cả Gundam / Gunpla",
    subtitle: "Khám phá hàng sẵn, hàng order, pre-order, sale và phụ kiện builder tại Gundam Store VN.",
    filters: "Bộ lọc sản phẩm",
    mobileFilters: "Lọc sản phẩm",
    categoryMenu: "Danh mục hàng",
    allCategories: "Tất cả danh mục",
    categorySearch: "Tìm danh mục...",
    clear: "Xóa lọc",
    all: "Tất cả",
    category: "Danh mục",
    status: "Tình trạng",
    grade: "Grade",
    scale: "Scale",
    series: "Series",
    stock: "Tồn kho",
    priceRange: "Khoảng giá",
    search: "Tìm sản phẩm, SKU, series...",
    sort: "Sắp xếp",
    popular: "Phổ biến",
    newest: "Mới nhất",
    priceLow: "Giá thấp đến cao",
    priceHigh: "Giá cao đến thấp",
    bestSelling: "Bán chạy",
    noProducts: "Không có sản phẩm phù hợp.",
    loadMore: "Xem thêm sản phẩm",
    result: "sản phẩm phù hợp",
    quickForYou: "Gợi ý nhanh",
    inStock: "Hàng sẵn",
    preorder: "Pre-order",
    sale: "Sale",
    outOfStock: "Hết hàng",
    under500: "Dưới 500K",
    from500to1000: "500K - 1 triệu",
    above1000: "Trên 1 triệu",
    apply: "Áp dụng",
    close: "Đóng",
  },
  en: {
    home: "Home",
    shopPage: "Shop",
    title: "All Gundam / Gunpla",
    subtitle: "Explore in-stock kits, order items, pre-orders, sale items and builder accessories.",
    filters: "Product filters",
    mobileFilters: "Filter products",
    categoryMenu: "Categories",
    allCategories: "All categories",
    categorySearch: "Search categories...",
    clear: "Clear",
    all: "All",
    category: "Category",
    status: "Status",
    grade: "Grade",
    scale: "Scale",
    series: "Series",
    stock: "Stock",
    priceRange: "Price range",
    search: "Search products, SKU, series...",
    sort: "Sort by",
    popular: "Popular",
    newest: "Newest",
    priceLow: "Price low to high",
    priceHigh: "Price high to low",
    bestSelling: "Best selling",
    noProducts: "No products match.",
    loadMore: "Load more",
    result: "matching products",
    quickForYou: "Quick picks",
    inStock: "In stock",
    preorder: "Pre-order",
    sale: "Sale",
    outOfStock: "Out of stock",
    under500: "Under 500K",
    from500to1000: "500K - 1M",
    above1000: "Above 1M",
    apply: "Apply",
    close: "Close",
  },
};

const DEFAULT_GRADES = ["HG", "RG", "MG", "MGEX", "PG", "SD", "FM", "RE/100"];
const DEFAULT_SCALES = ["1/144", "1/100", "1/60", "SD"];
const DEFAULT_SERIES = ["SEED", "UC", "WFM", "IBO", "Wing", "00", "Build", "G Gundam"];
const PAGE_SIZE = 12;

const CATEGORY_GROUPS = [
  {
    id: "gunpla-gundam",
    name: "GUNPLA - GUNDAM",
    keywords: ["gunpla", "gundam", "master grade", "real grade", "high grade", "perfect grade", "mg", "rg", "hg", "pg", "option parts"],
  },
  {
    id: "30-minutes-label",
    name: "30 Minutes Label",
    keywords: ["30 minutes", "30mm", "30ms", "30mf", "sisters", "missions", "fantasy"],
  },
  {
    id: "pokemon-plamo",
    name: "Pokémon PLAMO COLLECTION",
    keywords: ["pokemon", "pokémon", "plamo"],
  },
  {
    id: "armored-core",
    name: "Armored Core VI Fires of Rubicon",
    keywords: ["armored core", "rubicon"],
  },
  {
    id: "keroro",
    name: "Sgt. Frog - Keroro Gunso",
    keywords: ["keroro", "sgt", "frog", "gunso"],
  },
  {
    id: "tools-paint-accessories",
    name: "Tools / Paint / Accessories",
    keywords: ["tool", "tools", "paint", "sơn", "accessory", "accessories", "phụ kiện", "decal", "stand", "base"],
  },
];

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || "";
}

function getCategoryName(category, lang) {
  return category.name?.[lang] || category.name?.vi || category.name?.en || category.label || category.nameVi || category.nameEn || category.id;
}

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getCategoryIdentity(category = {}) {
  return [category.id, category.backendCategoryId, category.slug, category.code].filter(Boolean).map(String);
}

function getProductCategoryIdentity(product = {}) {
  return [
    product.categoryId,
    product.category?.id,
    product.category?.slug,
    product.category?.code,
  ].filter(Boolean).map(String);
}

function productMatchesCategoryIds(product = {}, categoryIds = []) {
  if (!categoryIds?.length) return true;
  const productIds = getProductCategoryIdentity(product);
  return categoryIds.some((id) => productIds.includes(String(id)));
}

function hasCommercialDiscount(product = {}) {
  const finalPrice = Number(product.finalPrice || product.effectivePrice || product.price || 0);
  const compareAtPrice = Number(product.compareAtPrice || product.oldPrice || product.originalPrice || 0);
  return Boolean(product.activePromotion) || Number(product.discountAmount || 0) > 0 || (finalPrice > 0 && compareAtPrice > finalPrice);
}

function getProductSearchText(product, lang) {
  return [
    getProductName(product, lang),
    product.sku,
    product.brand,
    product.grade,
    product.scale,
    product.series,
    product.status,
    product.category?.nameVi,
    product.category?.nameEn,
    product.tags?.join?.(" "),
    product.short?.vi,
    product.short?.en,
  ].filter(Boolean).join(" ").toLowerCase();
}

function inferSeries(product) {
  const value = getProductSearchText(product, "vi");
  if (value.includes("seed") || value.includes("freedom") || value.includes("justice")) return "SEED";
  if (value.includes("unicorn") || value.includes("nu ") || value.includes("hi-nu") || value.includes("uc")) return "UC";
  if (value.includes("aerial") || value.includes("witch") || value.includes("wfm")) return "WFM";
  if (value.includes("barbatos") || value.includes("ibo")) return "IBO";
  if (value.includes("wing") || value.includes("zero")) return "Wing";
  if (value.includes("exia") || value.includes("00")) return "00";
  if (value.includes("build")) return "Build";
  if (value.includes("god gundam") || value.includes("g gundam")) return "G Gundam";
  return product.series || "";
}

function inferScale(product) {
  const value = getProductSearchText(product, "vi");
  if (product.scale) return product.scale;
  if (value.includes("1/144")) return "1/144";
  if (value.includes("1/100")) return "1/100";
  if (value.includes("1/60")) return "1/60";
  if (String(product.grade || "").toUpperCase() === "SD") return "SD";
  return "";
}

function getStockStatus(product) {
  const stock = Number(product.stock ?? product.inventory ?? product.quantity ?? 0);
  const status = normalizeText(product.status);
  if (status.includes("pre")) return "preorder";
  if (hasCommercialDiscount(product)) return "sale";
  if (stock <= 0 || status.includes("out")) return "outOfStock";
  return "inStock";
}

function getUniqueOptions(products, getter, fallback = []) {
  const values = products.map(getter).filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  return Array.from(new Set([...fallback, ...values]));
}

function inferCategoryGroup(category = {}) {
  const raw = [category.id, category.code, category.slug, category.label, category.nameVi, category.nameEn, category.name?.vi, category.name?.en]
    .filter(Boolean)
    .join(" ");
  const normalized = normalizeText(raw);
  const matched = CATEGORY_GROUPS.find((group) => group.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  return matched || null;
}

function buildCategoryTree(categories = [], products = [], lang = "vi") {
  const activeCategories = [...(categories || [])]
    .filter((item) => item.active !== false)
    .sort((a, b) => Number(a.sortOrder || a.sort || 0) - Number(b.sortOrder || b.sort || 0) || getCategoryName(a, lang).localeCompare(getCategoryName(b, lang)));

  const productCountByCategory = new Map();
  for (const product of products || []) {
    for (const id of getProductCategoryIdentity(product)) {
      productCountByCategory.set(id, (productCountByCategory.get(id) || 0) + 1);
    }
  }

  const rootMap = new Map();

  function ensureRoot(id, name, sortOrder = 999) {
    if (!rootMap.has(id)) {
      rootMap.set(id, { id, name, sortOrder, count: 0, categoryIds: [], children: [] });
    }
    return rootMap.get(id);
  }

  for (const category of activeCategories) {
    const ids = getCategoryIdentity(category);
    const count = ids.reduce((sum, id) => Math.max(sum, productCountByCategory.get(id) || 0), 0);
    const group = inferCategoryGroup(category);
    const root = group
      ? ensureRoot(group.id, group.name, CATEGORY_GROUPS.findIndex((item) => item.id === group.id))
      : ensureRoot(ids[0] || category.id, getCategoryName(category, lang), Number(category.sortOrder || category.sort || 500));

    const child = {
      id: ids[0] || category.id,
      name: getCategoryName(category, lang),
      count,
      categoryIds: ids,
      imageUrl: category.icon || category.imageUrl || category.image || "",
    };

    root.categoryIds.push(...ids);
    root.count += count;

    if (group) {
      root.children.push(child);
    }
  }

  return Array.from(rootMap.values())
    .map((root) => ({
      ...root,
      categoryIds: Array.from(new Set(root.categoryIds)),
      children: root.children
        .filter((child, index, array) => array.findIndex((item) => item.id === child.id) === index)
        .sort((a, b) => Number(b.count || 0) - Number(a.count || 0) || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999) || Number(b.count || 0) - Number(a.count || 0));
}

function findCategoryNode(nodes = [], id = "all") {
  if (id === "all") return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = node.children?.find((item) => item.id === id);
    if (child) return child;
  }
  return null;
}

function CategoryTree({ t, nodes, activeId, onSelect, search, setSearch, compact = false }) {
  const q = normalizeText(search);
  const filteredNodes = nodes
    .map((node) => {
      const childMatches = (node.children || []).filter((child) => normalizeText(child.name).includes(q));
      const nodeMatches = !q || normalizeText(node.name).includes(q);
      return nodeMatches ? node : childMatches.length ? { ...node, children: childMatches } : null;
    })
    .filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <Search size={16} className="text-blue-600" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold outline-none placeholder:text-slate-400"
          placeholder={t.categorySearch}
        />
      </div>

      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-black transition ${
          activeId === "all" ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-blue-50"
        }`}
      >
        <span>{t.allCategories}</span>
      </button>

      <div className="space-y-3">
        {filteredNodes.map((node) => {
          const active = activeId === node.id || node.children?.some((child) => child.id === activeId);
          return (
            <div key={node.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition ${active ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}`}
              >
                <span className="min-w-0 flex-1 text-sm font-black leading-tight text-slate-950">{node.name}</span>
                <span className="shrink-0 text-xs font-black text-slate-400">({node.count || 0})</span>
              </button>

              {node.children?.length > 0 && (
                <div className="divide-y divide-slate-100 border-t border-slate-100">
                  {node.children.slice(0, compact ? 8 : 100).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${
                        activeId === child.id ? "bg-slate-950 text-white" : "hover:bg-slate-50"
                      }`}
                    >
                      <span className="min-w-0 flex items-center gap-2 text-sm font-bold">
                        {child.imageUrl && <img src={child.imageUrl} alt="" className="h-7 w-7 rounded-lg object-contain" loading="lazy" decoding="async" />}
                        <span className="line-clamp-1">{child.name}</span>
                      </span>
                      <span className={`shrink-0 text-xs font-black ${activeId === child.id ? "text-white/70" : "text-slate-400"}`}>({child.count || 0})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryBottomSheet({ t, nodes, activeId, onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [selectedRoot, setSelectedRoot] = useState(null);
  const root = selectedRoot ? nodes.find((node) => node.id === selectedRoot) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
      <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => (root ? setSelectedRoot(null) : onClose())} className="rounded-full bg-slate-100 p-2 text-slate-700">
              {root ? <ChevronLeft size={18} /> : <X size={18} />}
            </button>
            <div className="min-w-0 flex-1 text-center text-base font-black text-slate-950">{root ? root.name : t.categoryMenu}</div>
            <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-700"><X size={18} /></button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-4">
          {!root ? (
            <CategoryTree
              t={t}
              nodes={nodes}
              activeId={activeId}
              onSelect={(id) => {
                const node = nodes.find((item) => item.id === id);
                if (node?.children?.length) {
                  setSelectedRoot(id);
                  return;
                }
                onSelect(id);
                onClose();
              }}
              search={search}
              setSearch={setSearch}
              compact
            />
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onSelect(root.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black ${activeId === root.id ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}
              >
                <span>{t.all} {root.name}</span>
                <span>({root.count || 0})</span>
              </button>
              {(root.children || []).map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    onSelect(child.id);
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold ${activeId === child.id ? "bg-slate-950 text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {child.imageUrl && <img src={child.imageUrl} alt="" className="h-8 w-8 rounded-lg object-contain" loading="lazy" decoding="async" />}
                    <span className="line-clamp-1">{child.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">({child.count || 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductFilterContent({ t, filters, setFilters, grades, scales, seriesOptions, statusOptions, reset }) {
  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.stock}</div>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter("stock", item.value)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${filters.stock === item.value ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.grade}</div>
        <div className="flex flex-wrap gap-2">
          {["all", ...grades].map((g) => (
            <button key={g} onClick={() => setFilter("grade", g)} className={`rounded-xl px-3 py-2 text-xs font-black ${filters.grade === g ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
              {g === "all" ? t.all : g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.scale}</div>
        <div className="flex flex-wrap gap-2">
          {["all", ...scales].map((value) => (
            <button key={value} onClick={() => setFilter("scale", value)} className={`rounded-xl px-3 py-2 text-xs font-black ${filters.scale === value ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
              {value === "all" ? t.all : value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.series}</div>
        <select value={filters.series} onChange={(event) => setFilter("series", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700 outline-none">
          <option value="all">{t.all}</option>
          {seriesOptions.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.priceRange}</div>
        <div className="grid grid-cols-2 gap-2">
          <input value={filters.minPrice} onChange={(event) => setFilter("minPrice", event.target.value)} inputMode="numeric" placeholder="Min" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold outline-none" />
          <input value={filters.maxPrice} onChange={(event) => setFilter("maxPrice", event.target.value)} inputMode="numeric" placeholder="Max" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold outline-none" />
        </div>
      </div>

      <button onClick={reset} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{t.clear}</button>
    </div>
  );
}

export default function ShopPage() {
  const { actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ category: "all", stock: "all", grade: "all", scale: "all", series: "all", minPrice: "", maxPrice: "" });
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [dbProducts, setDbProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q") || params.get("search") || "";
    if (keyword) setQuery(keyword.slice(0, 80));
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([getStorefrontProductsForStorefront(), getStorefrontCategoriesFromApi()])
      .then(([products, categories]) => {
        if (!alive) return;
        setDbProducts(products || []);
        setDbCategories(categories || []);
        setCatalogError("");
      })
      .catch((error) => {
        if (!alive) return;
        setDbProducts([]);
        setDbCategories([]);
        setCatalogError(error?.message || "Storefront catalog sync skipped.");
      });
    return () => { alive = false; };
  }, []);

  const activeCategories = useMemo(() => {
    return [...(dbCategories || [])]
      .filter((item) => item.active !== false)
      .sort((a, b) => Number(a.sortOrder || a.sort || 0) - Number(b.sortOrder || b.sort || 0));
  }, [dbCategories]);

  const baseProducts = useMemo(() => (dbProducts || []).filter((product) => product.active !== false), [dbProducts]);
  const categoryTree = useMemo(() => buildCategoryTree(activeCategories, baseProducts, lang), [activeCategories, baseProducts, lang]);
  const selectedCategoryNode = useMemo(() => findCategoryNode(categoryTree, filters.category), [categoryTree, filters.category]);

  const grades = useMemo(() => getUniqueOptions(baseProducts, (product) => product.grade, DEFAULT_GRADES), [baseProducts]);
  const scales = useMemo(() => getUniqueOptions(baseProducts, inferScale, DEFAULT_SCALES), [baseProducts]);
  const seriesOptions = useMemo(() => getUniqueOptions(baseProducts, inferSeries, DEFAULT_SERIES), [baseProducts]);

  const statusOptions = [
    { value: "all", label: t.all },
    { value: "inStock", label: t.inStock },
    { value: "preorder", label: t.preorder },
    { value: "sale", label: t.sale },
    { value: "outOfStock", label: t.outOfStock },
  ];

  const quickChips = [
    { key: "inStock", label: t.inStock, patch: { stock: "inStock" } },
    { key: "preorder", label: t.preorder, patch: { stock: "preorder" } },
    { key: "sale", label: t.sale, patch: { stock: "sale" } },
    { key: "RG", label: "RG", patch: { grade: "RG" } },
    { key: "MG", label: "MG", patch: { grade: "MG" } },
    { key: "under500", label: t.under500, patch: { minPrice: "", maxPrice: "500000" } },
    { key: "500to1000", label: t.from500to1000, patch: { minPrice: "500000", maxPrice: "1000000" } },
    { key: "above1000", label: t.above1000, patch: { minPrice: "1000000", maxPrice: "" } },
  ];

  const products = useMemo(() => {
    let result = baseProducts;
    const selectedIds = selectedCategoryNode?.categoryIds || [];

    if (query) {
      const q = normalizeText(query);
      result = result.filter((product) => normalizeText(getProductSearchText(product, lang)).includes(q));
    }

    if (filters.category !== "all") {
      result = result.filter((product) => productMatchesCategoryIds(product, selectedIds.length ? selectedIds : [filters.category]));
    }

    if (filters.stock !== "all") result = result.filter((product) => getStockStatus(product) === filters.stock);
    if (filters.grade !== "all") result = result.filter((product) => normalizeText(product.grade).toUpperCase() === String(filters.grade).toUpperCase());
    if (filters.scale !== "all") result = result.filter((product) => inferScale(product) === filters.scale);
    if (filters.series !== "all") result = result.filter((product) => inferSeries(product) === filters.series);

    const min = Number(String(filters.minPrice).replace(/\D/g, ""));
    const max = Number(String(filters.maxPrice).replace(/\D/g, ""));
    if (min > 0) result = result.filter((product) => Number(product.price || 0) >= min);
    if (max > 0) result = result.filter((product) => Number(product.price || 0) <= max);

    if (sort === "popular" || sort === "bestSelling") result = [...result].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    if (sort === "newest") result = [...result].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
    if (sort === "priceLow") result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "priceHigh") result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return result;
  }, [baseProducts, query, filters, sort, lang, selectedCategoryNode]);

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query, filters, sort]);

  function reset() {
    setQuery("");
    setFilters({ category: "all", stock: "all", grade: "all", scale: "all", series: "all", minPrice: "", maxPrice: "" });
  }

  function applyQuickChip(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
    actions.track("filter", { meta: patch });
  }

  function selectCategory(id) {
    setFilters((prev) => ({ ...prev, category: id }));
    actions.track("category_filter", { meta: { category: id } });
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "minPrice" || key === "maxPrice") return Boolean(value);
    return value !== "all";
  }).length;

  return (
    <PageShell>
      <section className="shop-mobile-shell mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-5 lg:px-8">
        {catalogError && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">{catalogError}</div>}

        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 sm:text-sm">
          <span>{t.home}</span><ChevronRight size={15} /><span className="text-slate-950">{t.shopPage}</span>
        </div>

        <div className="relative overflow-hidden rounded-[22px] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-100/60 sm:rounded-[2rem] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700"><Sparkles size={14} />{t.shopPage}</div>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl lg:text-5xl">{t.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:mt-3 sm:leading-7">{t.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500"><Filter size={15} className="text-blue-600" />{t.quickForYou}</div>
          <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickChips.map((chip) => <button key={chip.key} onClick={() => applyQuickChip(chip.patch)} className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-600 hover:text-white">{chip.label}</button>)}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="hidden space-y-4 lg:block">
          <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><SlidersHorizontal size={17} className="text-blue-600" />{t.categoryMenu}</div>
              <button onClick={reset} className="rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 hover:bg-slate-100">{t.clear}</button>
            </div>
            <CategoryTree t={t} nodes={categoryTree} activeId={filters.category} onSelect={selectCategory} search={categorySearch} setSearch={setCategorySearch} />
          </div>

          <div className="sticky top-[680px] rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-950"><Filter size={17} className="text-blue-600" />{t.filters}</div>
            <ProductFilterContent t={t} filters={filters} setFilters={setFilters} grades={grades} scales={scales} seriesOptions={seriesOptions} statusOptions={statusOptions} reset={reset} />
          </div>
        </aside>

        <div className="space-y-4 sm:space-y-5">
          <div className="sticky top-0 z-30 -mx-3 border-y border-slate-100 bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:static lg:mx-0 lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={18} className="text-blue-600" />
                <input value={query} onChange={(e) => { setQuery(e.target.value); actions.track("search", { meta: { query: e.target.value } }); }} className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400" placeholder={t.search} />
                {query && <button onClick={() => setQuery("")} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X size={16} /></button>}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button onClick={() => setMobileCategoryOpen(true)} className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 lg:hidden">
                  {selectedCategoryNode?.name || t.categoryMenu}
                </button>
                <button onClick={() => setMobileFilterOpen(true)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 lg:hidden">
                  <SlidersHorizontal size={16} className="mr-1 inline text-blue-600" />{t.mobileFilters}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>

                <div className="col-span-2 flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-1">
                  <span className="text-xs font-black text-slate-500">{t.sort}</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-black text-slate-800 outline-none">
                    <option value="popular">{t.popular}</option>
                    <option value="bestSelling">{t.bestSelling}</option>
                    <option value="newest">{t.newest}</option>
                    <option value="priceLow">{t.priceLow}</option>
                    <option value="priceHigh">{t.priceHigh}</option>
                  </select>
                </div>

                <div className="hidden items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:flex">
                  <button onClick={() => setView("grid")} className={`rounded-xl p-2 ${view === "grid" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"}`}><Grid3X3 size={17} /></button>
                  <button onClick={() => setView("list")} className={`rounded-xl p-2 ${view === "list" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"}`}><List size={17} /></button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
              <span>{products.length} {t.result}</span>
              {activeFilterCount > 0 && <button onClick={reset} className="font-black text-blue-600">{t.clear}</button>}
            </div>
          </div>

          {products.length > 0 ? (
            <div className={view === "grid" ? "shop-mobile-grid grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4" : "shop-mobile-list space-y-4"}>
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} view={view} lang={lang} actions={actions} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-black text-slate-950">{t.noProducts}</div>
              <button onClick={reset} className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.clear}</button>
            </div>
          )}

          {visibleCount < products.length && (
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, products.length))} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.loadMore}</button>
            </div>
          )}
        </div>
      </section>

      {mobileCategoryOpen && <CategoryBottomSheet t={t} nodes={categoryTree} activeId={filters.category} onSelect={selectCategory} onClose={() => setMobileCategoryOpen(false)} />}

      {mobileFilterOpen && (
        <div className="mobile-filter-drawer fixed inset-0 z-[9999] bg-slate-950/60 p-0 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto rounded-none bg-white p-5 shadow-2xl sm:rounded-l-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-black text-slate-950">{t.mobileFilters}</div>
              <button onClick={() => setMobileFilterOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-600"><X size={18} /></button>
            </div>
            <ProductFilterContent t={t} filters={filters} setFilters={setFilters} grades={grades} scales={scales} seriesOptions={seriesOptions} statusOptions={statusOptions} reset={reset} />
            <button onClick={() => setMobileFilterOpen(false)} className="mobile-filter-apply mt-4 w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">{t.apply}</button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
