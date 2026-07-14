import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import PageShell from "../../components/common/PageShell";
import ProductCard from "../../components/storefront/ProductCard";
import { useCms, useLang } from "../../store/CmsStore";
import {
  getStorefrontCategoryTreeFromApi,
  getStorefrontProductsForStorefront,
} from "../../services/StorefrontProductApiService";

const text = {
  vi: {
    home: "Trang chủ",
    shopPage: "Trang bán hàng",
    title: "Tất cả Gundam / Gunpla",
    subtitle: "Khám phá hàng sẵn, hàng order, pre-order, sale và phụ kiện builder tại Gundam Store VN.",
    categoryMenu: "Danh mục hàng",
    allCategories: "Tất cả danh mục",
    categorySearch: "Tìm danh mục...",
    filters: "Bộ lọc",
    all: "Tất cả",
    search: "Tìm sản phẩm, SKU, series...",
    sort: "Sắp xếp",
    popular: "Phổ biến",
    newest: "Mới nhất",
    priceLow: "Giá thấp đến cao",
    priceHigh: "Giá cao đến thấp",
    noProducts: "Không có sản phẩm phù hợp.",
    loadMore: "Xem thêm sản phẩm",
    result: "sản phẩm phù hợp",
    quickForYou: "Gợi ý nhanh",
    inStock: "Hàng sẵn",
    preorder: "Pre-order",
    sale: "Sale",
    outOfStock: "Hết hàng",
    clear: "Xóa lọc",
    apply: "Áp dụng",
  },
  en: {
    home: "Home",
    shopPage: "Shop",
    title: "All Gundam / Gunpla",
    subtitle: "Explore in-stock kits, order items, pre-orders, sale items and builder accessories.",
    categoryMenu: "Categories",
    allCategories: "All categories",
    categorySearch: "Search categories...",
    filters: "Filters",
    all: "All",
    search: "Search products, SKU, series...",
    sort: "Sort by",
    popular: "Popular",
    newest: "Newest",
    priceLow: "Price low to high",
    priceHigh: "Price high to low",
    noProducts: "No products match.",
    loadMore: "Load more",
    result: "matching products",
    quickForYou: "Quick picks",
    inStock: "In stock",
    preorder: "Pre-order",
    sale: "Sale",
    outOfStock: "Out of stock",
    clear: "Clear",
    apply: "Apply",
  },
};

const PAGE_SIZE = 12;

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getName(item = {}, lang = "vi") {
  if (typeof item.name === "string") return item.name;
  return item.name?.[lang] || item.nameVi || item.nameEn || item.label || item.code || item.id || "";
}

function getProductName(product = {}, lang = "vi") {
  if (typeof product.name === "string") return product.name;
  return product.name?.[lang] || product.name?.vi || product.name?.en || product.nameVi || product.nameEn || "";
}

function hasDiscount(product = {}) {
  const price = Number(product.finalPrice || product.price || 0);
  const oldPrice = Number(product.compareAtPrice || product.oldPrice || 0);
  return Boolean(product.activePromotion) || Number(product.discountAmount || 0) > 0 || (oldPrice > price && price > 0);
}

function getStockStatus(product = {}) {
  const status = normalize(product.status);
  const stock = Number(product.stock || product.totalStock || 0);
  if (status.includes("pre")) return "preorder";
  if (hasDiscount(product)) return "sale";
  if (stock <= 0 || status.includes("out")) return "outOfStock";
  return "inStock";
}

function productSearchText(product = {}, lang = "vi") {
  return [
    getProductName(product, lang),
    product.sku,
    product.slug,
    product.brand,
    product.grade,
    product.scale,
    product.status,
    product.category?.nameVi,
    product.category?.nameEn,
  ].filter(Boolean).join(" ");
}

function productCategoryKeys(product = {}) {
  return [product.categoryId, product.category?.id, product.category?.slug, product.category?.code]
    .filter(Boolean)
    .map(String);
}

function normalizeTreeNode(node = {}, lang = "vi") {
  const children = Array.isArray(node.children) ? node.children : [];
  const normalizedChildren = children.map((child) => ({
    ...child,
    id: child.id || child.backendCategoryId || child.slug || child.code,
    name: getName(child, lang),
    count: Number(child.productCount || child.count || 0),
    categoryIds: Array.from(new Set([child.id, child.backendCategoryId, child.slug, child.code, ...(child.categoryIds || [])].filter(Boolean).map(String))),
  }));

  return {
    ...node,
    id: node.id || node.slug || node.code,
    name: getName(node, lang),
    count: Number(node.productCount || node.count || normalizedChildren.reduce((sum, child) => sum + Number(child.count || 0), 0)),
    categoryIds: Array.from(new Set([...(node.categoryIds || []), ...normalizedChildren.flatMap((child) => child.categoryIds || [])].filter(Boolean).map(String))),
    children: normalizedChildren,
  };
}

function findNode(tree = [], id = "all") {
  if (id === "all") return null;
  for (const root of tree) {
    if (root.id === id) return root;
    const child = root.children?.find((item) => item.id === id);
    if (child) return child;
  }
  return null;
}

function findNodeByUrlKey(tree = [], rawKey = "") {
  const key = String(rawKey || "").trim();

  if (!key || key === "all") return null;

  for (const root of tree) {
    const nodes = [root, ...(root.children || [])];

    const match = nodes.find((node) =>
      [
        node.id,
        node.backendCategoryId,
        node.slug,
        node.code,
      ]
        .filter(Boolean)
        .map(String)
        .includes(key)
    );

    if (match) return match;
  }

  return null;
}

function CategoryTree({ t, lang, tree, activeId, onSelect, search, setSearch, allCount }) {
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const q = normalize(search);
  const visibleTree = tree
    .map((node) => {
      const nodeMatch = !q || normalize(node.name).includes(q);
      const children = (node.children || []).filter((child) => !q || normalize(child.name).includes(q));
      return nodeMatch ? node : children.length ? { ...node, children } : null;
    })
    .filter(Boolean);
  const totalCount = Number.isFinite(Number(allCount))
    ? Number(allCount)
    : tree.reduce((sum, node) => sum + Number(node.count || node.productCount || 0), 0);

  useEffect(() => {
    const activeParent = tree.find(
      (node) => node.id === activeId || node.children?.some((child) => child.id === activeId)
    );

    if (!activeParent?.children?.length) return;

    setExpandedIds((current) => {
      if (current.has(activeParent.id)) return current;
      const next = new Set(current);
      next.add(activeParent.id);
      return next;
    });
  }, [activeId, tree]);

  function toggleExpanded(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-black transition ${activeId === "all" ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}
      >
        <span>{t.allCategories}</span>
        <span className={`shrink-0 text-xs font-black ${activeId === "all" ? "text-white/70" : "text-slate-400"}`}>({totalCount})</span>
      </button>

      {visibleTree.map((node) => {
        const children = node.children || [];
        const hasChildren = children.length > 0;
        const hasActiveChild = children.some((child) => child.id === activeId);
        const active = activeId === node.id || hasActiveChild;
        const expanded = Boolean(q) || expandedIds.has(node.id) || hasActiveChild;

        return (
          <div key={node.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${active ? "border-blue-200" : "border-slate-100"}`}>
            <div className={`flex items-stretch ${active ? "bg-blue-50" : "hover:bg-slate-50"}`}>
              <button
                type="button"
                onClick={() => onSelect(node.id)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-3 text-left"
              >
                <span className="min-w-0 flex-1 text-sm font-black leading-tight text-slate-950">{node.name}</span>
                <span className="shrink-0 text-xs font-black text-slate-400">({node.count || 0})</span>
              </button>

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(node.id)}
                  aria-expanded={expanded}
                  aria-label={expanded ? "Thu gọn danh mục con" : "Mở danh mục con"}
                  className={`flex w-11 shrink-0 items-center justify-center border-l transition ${active ? "border-blue-100 text-blue-700" : "border-slate-100 text-slate-500 hover:bg-slate-100"}`}
                >
                  <ChevronRight size={18} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>

            {hasChildren && expanded && (
              <div className="ml-4 divide-y divide-slate-100 border-l-2 border-blue-100 bg-slate-50/50 pl-2">
                {children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => onSelect(child.id)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition ${activeId === child.id ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-blue-50"}`}
                  >
                    <span className="min-w-0 flex items-center gap-2 text-sm font-bold">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeId === child.id ? "bg-blue-300" : "bg-blue-500"}`} />
                      {(child.icon || child.imageUrl) && <img src={child.icon || child.imageUrl} alt="" className="h-7 w-7 rounded-lg object-contain" loading="lazy" decoding="async" />}
                      <span className="line-clamp-1">{getName(child, lang)}</span>
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
  );
}

function CategoryBottomSheet({ t, lang, tree, activeId, onSelect, onClose, allCount }) {
  const [search, setSearch] = useState("");
  const [rootId, setRootId] = useState(null);
  const root = rootId ? tree.find((node) => node.id === rootId) : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm lg:hidden">
      <div className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-hidden rounded-t-[2rem] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => (root ? setRootId(null) : onClose())} className="rounded-full bg-slate-100 p-2 text-slate-700">
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
              lang={lang}
              tree={tree}
              activeId={activeId}
              search={search}
              setSearch={setSearch}
              allCount={allCount}
              onSelect={(id) => {
                onSelect(id);
                onClose();
              }}
            />
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { onSelect(root.id); onClose(); }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black ${activeId === root.id ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-700"}`}
              >
                <span>{t.all} {root.name}</span>
                <span>({root.count || 0})</span>
              </button>
              {root.children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => { onSelect(child.id); onClose(); }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold ${activeId === child.id ? "bg-slate-950 text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"}`}
                >
                  <span className="line-clamp-1">{getName(child, lang)}</span>
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

export default function ShopPage() {
  const { actions } = useCms();
  const [lang] = useLang();
  const t = text[lang];

  const [query, setQuery] = useState("");
  const [stock, setStock] = useState("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [sort, setSort] = useState("popular");
  const [requestedCategoryKey] = useState(() => {
    try {
      return (
        new URLSearchParams(window.location.search).get("category") ||
        ""
      );
    } catch {
      return "";
    }
  });
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [productsFromApi, setProductsFromApi] = useState([]);
  const [categoryTreeFromApi, setCategoryTreeFromApi] = useState([]);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get("q") || params.get("search") || "";
    if (keyword) setQuery(keyword.slice(0, 80));
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([getStorefrontProductsForStorefront(), getStorefrontCategoryTreeFromApi()])
      .then(([products, categoryData]) => {
        if (!alive) return;
        setProductsFromApi(products || []);
        setCategoryTreeFromApi(Array.isArray(categoryData?.tree) ? categoryData.tree : []);
        setCatalogError("");
      })
      .catch((error) => {
        if (!alive) return;
        setProductsFromApi([]);
        setCategoryTreeFromApi([]);
        setCatalogError(error?.message || "Storefront catalog sync skipped.");
      });
    return () => { alive = false; };
  }, []);

  const categoryTree = useMemo(() => categoryTreeFromApi.map((node) => normalizeTreeNode(node, lang)), [categoryTreeFromApi, lang]);
  useEffect(() => {
    if (!requestedCategoryKey || !categoryTree.length) return;

    if (requestedCategoryKey === "all") {
      setSelectedCategoryId("all");
      return;
    }

    const requestedNode = findNodeByUrlKey(
      categoryTree,
      requestedCategoryKey
    );

    if (requestedNode?.id) {
      setSelectedCategoryId(requestedNode.id);
    }
  }, [categoryTree, requestedCategoryKey]);

  const selectedNode = useMemo(() => findNode(categoryTree, selectedCategoryId), [categoryTree, selectedCategoryId]);
  const catalogProductCount = useMemo(
    () => (productsFromApi || []).filter((product) => product.active !== false).length,
    [productsFromApi]
  );

  const filteredProducts = useMemo(() => {
    let result = (productsFromApi || []).filter((product) => product.active !== false);

    if (query) {
      const q = normalize(query);
      result = result.filter((product) => normalize(productSearchText(product, lang)).includes(q));
    }

    if (selectedCategoryId !== "all") {
      const selectedIds = selectedNode?.categoryIds?.length ? selectedNode.categoryIds : [selectedCategoryId];
      result = result.filter((product) => {
        const keys = productCategoryKeys(product);
        return selectedIds.some((id) => keys.includes(String(id)));
      });
    }

    if (stock !== "all") {
      result = result.filter((product) => getStockStatus(product) === stock);
    }

    if (sort === "popular") result = [...result].sort((a, b) => Number(b.sold || 0) - Number(a.sold || 0));
    if (sort === "newest") result = [...result].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
    if (sort === "priceLow") result = [...result].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sort === "priceHigh") result = [...result].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));

    return result;
  }, [productsFromApi, query, selectedCategoryId, selectedNode, stock, sort, lang]);

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query, selectedCategoryId, stock, sort]);

  function resetFilters() {
    setQuery("");
    setStock("all");
    setSelectedCategoryId("all");
  }

  function selectCategory(id) {
    setSelectedCategoryId(id);
    actions.track("category_filter", { meta: { category: id } });
  }

  const quickChips = [
    { key: "inStock", label: t.inStock, value: "inStock" },
    { key: "preorder", label: t.preorder, value: "preorder" },
    { key: "sale", label: t.sale, value: "sale" },
    { key: "outOfStock", label: t.outOfStock, value: "outOfStock" },
  ];

  return (
    <PageShell>
      <section className="mx-auto max-w-[1440px] px-3 py-4 sm:px-4 sm:py-5 lg:px-8">
        {catalogError && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800">{catalogError}</div>}

        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 sm:text-sm">
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
            {quickChips.map((chip) => (
              <button key={chip.key} onClick={() => setStock(chip.value)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black ${stock === chip.value ? "border-blue-700 bg-blue-700 text-white" : "border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"}`}>{chip.label}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-5 px-3 py-4 sm:px-4 lg:grid-cols-[320px_1fr] lg:px-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950"><SlidersHorizontal size={17} className="text-blue-600" />{t.categoryMenu}</div>
              <button onClick={resetFilters} className="rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 hover:bg-slate-100">{t.clear}</button>
            </div>
            <CategoryTree t={t} lang={lang} tree={categoryTree} activeId={selectedCategoryId} onSelect={selectCategory} search={categorySearch} setSearch={setCategorySearch} allCount={catalogProductCount} />
          </div>
        </aside>

        <div className="space-y-4 sm:space-y-5">
          <div className="sticky top-0 z-30 -mx-3 border-y border-slate-100 bg-white/95 px-3 py-3 shadow-sm backdrop-blur lg:static lg:mx-0 lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search size={18} className="text-blue-600" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400" placeholder={t.search} />
                {query && <button onClick={() => setQuery("")} className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-700"><X size={16} /></button>}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <button onClick={() => setMobileCategoryOpen(true)} className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-black text-blue-700 lg:hidden">
                  {selectedNode?.name || t.categoryMenu}
                </button>
                <button onClick={() => setMobileFilterOpen(true)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 lg:hidden">
                  <SlidersHorizontal size={16} className="mr-1 inline text-blue-600" />{t.filters}
                </button>

                <div className="col-span-2 flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 sm:col-span-1">
                  <span className="text-xs font-black text-slate-500">{t.sort}</span>
                  <select value={sort} onChange={(event) => setSort(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs font-black text-slate-800 outline-none">
                    <option value="popular">{t.popular}</option>
                    <option value="newest">{t.newest}</option>
                    <option value="priceLow">{t.priceLow}</option>
                    <option value="priceHigh">{t.priceHigh}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
              <span>{filteredProducts.length} {t.result}</span>
              {(selectedCategoryId !== "all" || stock !== "all" || query) && <button onClick={resetFilters} className="font-black text-blue-600">{t.clear}</button>}
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="shop-mobile-grid grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} lang={lang} actions={actions} />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <div className="text-lg font-black text-slate-950">{t.noProducts}</div>
              <button onClick={resetFilters} className="mt-4 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.clear}</button>
            </div>
          )}

          {visibleCount < filteredProducts.length && (
            <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredProducts.length))} className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 hover:bg-blue-800">{t.loadMore}</button>
            </div>
          )}
        </div>
      </section>

      {mobileCategoryOpen && <CategoryBottomSheet t={t} lang={lang} tree={categoryTree} activeId={selectedCategoryId} onSelect={selectCategory} onClose={() => setMobileCategoryOpen(false)} allCount={catalogProductCount} />}

      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 p-0 backdrop-blur-sm lg:hidden">
          <div className="ml-auto h-full w-full max-w-md overflow-y-auto rounded-none bg-white p-5 shadow-2xl sm:rounded-l-3xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-black text-slate-950">{t.filters}</div>
              <button onClick={() => setMobileFilterOpen(false)} className="rounded-xl bg-slate-100 p-2 text-slate-600"><X size={18} /></button>
            </div>
            <div className="grid gap-2">
              {["all", "inStock", "preorder", "sale", "outOfStock"].map((value) => (
                <button key={value} onClick={() => setStock(value)} className={`rounded-2xl px-4 py-3 text-left text-sm font-black ${stock === value ? "bg-blue-700 text-white" : "bg-slate-50 text-slate-700"}`}>
                  {value === "all" ? t.all : t[value]}
                </button>
              ))}
            </div>
            <button onClick={() => setMobileFilterOpen(false)} className="mt-4 w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-black text-white">{t.apply}</button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
