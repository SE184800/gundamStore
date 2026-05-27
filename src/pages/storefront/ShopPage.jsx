import { useMemo, useState } from "react";
import {
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

const text = {
  vi: {
    home: "Trang chủ",
    shopPage: "Trang bán hàng",
    title: "Tất cả Gundam / Gunpla",
    subtitle:
      "Khám phá hàng sẵn, hàng order, pre-order, sale và phụ kiện builder tại Gundam Store VN.",
    filters: "Bộ lọc sản phẩm",
    mobileFilters: "Lọc sản phẩm",
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
    limited: "Limited",
    beginner: "Dễ build",
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
    subtitle:
      "Explore in-stock kits, order items, pre-orders, sale items and builder accessories.",
    filters: "Product filters",
    mobileFilters: "Filter products",
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
    limited: "Limited",
    beginner: "Beginner friendly",
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

function getProductName(product, lang) {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || "";
}

function getCategoryName(category, lang) {
  return category.name?.[lang] || category.name?.vi || category.label || category.id;
}

function isProductInCategory(productId, categoryId, mappings) {
  return (mappings || []).some(
    (item) => item.productId === productId && (item.categoryIds || []).includes(categoryId)
  );
}

function normalizeText(value = "") {
  return String(value || "").toLowerCase().trim();
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
    product.tags?.join?.(" "),
    product.short?.vi,
    product.short?.en,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferSeries(product) {
  const text = getProductSearchText(product, "vi");

  if (text.includes("seed") || text.includes("freedom") || text.includes("justice")) return "SEED";
  if (text.includes("unicorn") || text.includes("nu ") || text.includes("hi-nu") || text.includes("uc")) return "UC";
  if (text.includes("aerial") || text.includes("witch") || text.includes("wfm")) return "WFM";
  if (text.includes("barbatos") || text.includes("ibo")) return "IBO";
  if (text.includes("wing") || text.includes("zero")) return "Wing";
  if (text.includes("exia") || text.includes("00")) return "00";
  if (text.includes("build")) return "Build";
  if (text.includes("god gundam") || text.includes("g gundam")) return "G Gundam";

  return product.series || "";
}

function inferScale(product) {
  const text = getProductSearchText(product, "vi");

  if (product.scale) return product.scale;
  if (text.includes("1/144")) return "1/144";
  if (text.includes("1/100")) return "1/100";
  if (text.includes("1/60")) return "1/60";
  if (String(product.grade || "").toUpperCase() === "SD") return "SD";

  return "";
}

function getStockStatus(product) {
  const stock = Number(product.stock ?? product.inventory ?? product.quantity ?? 0);
  const status = normalizeText(product.status);

  if (status.includes("pre")) return "preorder";
  if (status.includes("sale")) return "sale";
  if (stock <= 0 || status.includes("out")) return "outOfStock";
  return "inStock";
}

function getUniqueOptions(products, getter, fallback = []) {
  const values = products
    .map(getter)
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean);

  return Array.from(new Set([...fallback, ...values]));
}

function ProductFilterContent({
  t,
  lang,
  activeCategories,
  filters,
  setFilters,
  grades,
  scales,
  seriesOptions,
  statusOptions,
  reset,
}) {
  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.category}</div>
        <div className="grid gap-2">
          <button
            onClick={() => setFilter("category", "all")}
            className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${
              filters.category === "all"
                ? "bg-blue-700 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.all}
          </button>
          {activeCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter("category", item.id)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${
                filters.category === item.id
                  ? "bg-blue-700 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {getCategoryName(item, lang)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.stock}</div>
        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter("stock", item.value)}
              className={`rounded-xl px-3 py-2 text-left text-xs font-bold ${
                filters.stock === item.value
                  ? "bg-blue-700 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
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
            <button
              key={g}
              onClick={() => setFilter("grade", g)}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                filters.grade === g
                  ? "bg-slate-950 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {g === "all" ? t.all : g}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.scale}</div>
        <div className="flex flex-wrap gap-2">
          {["all", ...scales].map((value) => (
            <button
              key={value}
              onClick={() => setFilter("scale", value)}
              className={`rounded-xl px-3 py-2 text-xs font-black ${
                filters.scale === value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {value === "all" ? t.all : value}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.series}</div>
        <select
          value={filters.series}
          onChange={(event) => setFilter("series", event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-black text-slate-700 outline-none"
        >
          <option value="all">{t.all}</option>
          {seriesOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-2 text-xs font-black uppercase text-slate-500">{t.priceRange}</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={filters.minPrice}
            onChange={(event) => setFilter("minPrice", event.target.value)}
            inputMode="numeric"
            placeholder="Min"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold outline-none"
          />
          <input
            value={filters.maxPrice}
            onChange={(event) => setFilter("maxPrice", event.target.value)}
            inputMode="numeric"
            placeholder="Max"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold outline-none"
          />
        </div>
      </div>

      <button
        onClick={reset}
        className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
      >
        {t.clear}
      </button>
    </div>
  );
}

export default function ShopPage() {
  const { state, actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "all",
    stock: "all",
    grade: "all",
    scale: "all",
    series: "all",
    minPrice: "",
    maxPrice: "",
  });
  const [sort, setSort] = useState("popular");
  const [view, setView] = useState("grid");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const activeCategories = useMemo(() => {
    return [...(state.categories || [])]
      .filter((item) => item.active !== false)
      .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  }, [state.categories]);

  const baseProducts = useMemo(() => {
    return (state.products || []).filter((product) => product.active !== false);
  }, [state.products]);

  const grades = useMemo(() => {
    return getUniqueOptions(baseProducts, (product) => product.grade, DEFAULT_GRADES);
  }, [baseProducts]);

  const scales = useMemo(() => {
    return getUniqueOptions(baseProducts, inferScale, DEFAULT_SCALES);
  }, [baseProducts]);

  const seriesOptions = useMemo(() => {
    return getUniqueOptions(baseProducts, inferSeries, DEFAULT_SERIES);
  }, [baseProducts]);

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
    { key: "SEED", label: "SEED", patch: { series: "SEED" } },
    { key: "UC", label: "UC", patch: { series: "UC" } },
    { key: "under500", label: t.under500, patch: { minPrice: "", maxPrice: "500000" } },
    { key: "500to1000", label: t.from500to1000, patch: { minPrice: "500000", maxPrice: "1000000" } },
    { key: "above1000", label: t.above1000, patch: { minPrice: "1000000", maxPrice: "" } },
  ];

  const products = useMemo(() => {
    let result = baseProducts;

    if (query) {
      const q = normalizeText(query);
      result = result.filter((product) => getProductSearchText(product, lang).includes(q));
    }

    if (filters.category !== "all") {
      result = result.filter((product) =>
        isProductInCategory(product.id, filters.category, state.productCategoryMappings || [])
      );
    }

    if (filters.stock !== "all") {
      result = result.filter((product) => getStockStatus(product) === filters.stock);
    }

    if (filters.grade !== "all") {
      result = result.filter(
        (product) => normalizeText(product.grade).toUpperCase() === String(filters.grade).toUpperCase()
      );
    }

    if (filters.scale !== "all") {
      result = result.filter((product) => inferScale(product) === filters.scale);
    }

    if (filters.series !== "all") {
      result = result.filter((product) => inferSeries(product) === filters.series);
    }

    const min = Number(String(filters.minPrice).replace(/\D/g, ""));
    const max = Number(String(filters.maxPrice).replace(/\D/g, ""));

    if (min > 0) {
      result = result.filter((product) => Number(product.price || 0) >= min);
    }

    if (max > 0) {
      result = result.filter((product) => Number(product.price || 0) <= max);
    }

    if (sort === "popular" || sort === "bestSelling") {
      result = [...result].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    }
    if (sort === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime()
      );
    }
    if (sort === "priceLow") {
      result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }
    if (sort === "priceHigh") {
      result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    }

    return result;
  }, [
    baseProducts,
    query,
    filters,
    sort,
    lang,
    state.productCategoryMappings,
  ]);

  function reset() {
    setQuery("");
    setFilters({
      category: "all",
      stock: "all",
      grade: "all",
      scale: "all",
      series: "all",
      minPrice: "",
      maxPrice: "",
    });
  }

  function applyQuickChip(patch) {
    setFilters((prev) => ({ ...prev, ...patch }));
    actions.track("filter", { meta: patch });
  }

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "minPrice" || key === "maxPrice") return Boolean(value);
    return value !== "all";
  }).length;

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <span>{t.home}</span>
          <ChevronRight size={16} />
          <span className="text-slate-950">{t.shopPage}</span>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-100/60 sm:rounded-[2rem] sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-cyan-50" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-blue-700">
              <Sparkles size={14} />
              {t.shopPage}
            </div>
            <h1 className="text-2xl font-black text-slate-950 sm:text-3xl lg:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            <Filter size={15} className="text-blue-600" />
            {t.quickForYou}
          </div>

          <div className="mobile-hide-scrollbar flex gap-2 overflow-x-auto pb-1">
            {quickChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => applyQuickChip(chip.patch)}
                className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700 hover:bg-blue-600 hover:text-white"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-4 py-5 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="hidden space-y-4 lg:block">
          <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950">
                <SlidersHorizontal size={17} className="text-blue-600" />
                {t.filters}
              </div>
              <button
                onClick={reset}
                className="rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 hover:bg-slate-100"
              >
                {t.clear}
              </button>
            </div>

            <ProductFilterContent
              t={t}
              lang={lang}
              activeCategories={activeCategories}
              filters={filters}
              setFilters={setFilters}
              grades={grades}
              scales={scales}
              seriesOptions={seriesOptions}
              statusOptions={statusOptions}
              reset={reset}
            />
          </div>
        </aside>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={18} className="text-blue-600" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    actions.track("search", { meta: { query: e.target.value } });
                  }}
                  className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400"
                  placeholder={t.search}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 lg:hidden"
                >
                  <SlidersHorizontal size={16} className="mr-1 inline text-blue-600" />
                  {t.mobileFilters}
                  {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </button>

                <div className="flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <span className="text-xs font-black text-slate-500">{t.sort}</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-800 outline-none"
                  >
                    <option value="popular">{t.popular}</option>
                    <option value="bestSelling">{t.bestSelling}</option>
                    <option value="newest">{t.newest}</option>
                    <option value="priceLow">{t.priceLow}</option>
                    <option value="priceHigh">{t.priceHigh}</option>
                  </select>
                </div>

                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    onClick={() => setView("grid")}
                    className={`rounded-xl p-2 ${
                      view === "grid" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <Grid3X3 size={17} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`rounded-xl p-2 ${
                      view === "list" ? "bg-blue-700 text-white" : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    <List size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
              <span>
                {products.length} {t.result}
              </span>
              {activeFilterCount > 0 && (
                <button onClick={reset} className="font-black text-blue-600">
                  {t.clear}
                </button>
              )}
            </div>
          </div>

          {products.length > 0 ? (
            <div className={view === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4" : "space-y-4"}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} view={view} lang={lang} actions={actions} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-black text-slate-950">{t.noProducts}</div>
              <button
                onClick={reset}
                className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800"
              >
                {t.clear}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <button className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">
              {t.loadMore}
            </button>
          </div>
        </div>
      </section>

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 p-0 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto rounded-none bg-white p-5 shadow-2xl sm:rounded-l-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-black text-slate-950">{t.mobileFilters}</div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-xl bg-slate-100 p-2 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <ProductFilterContent
              t={t}
              lang={lang}
              activeCategories={activeCategories}
              filters={filters}
              setFilters={setFilters}
              grades={grades}
              scales={scales}
              seriesOptions={seriesOptions}
              statusOptions={statusOptions}
              reset={reset}
            />

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-4 w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white"
            >
              {t.apply}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
