import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  Activity,
  Bell,
  ChevronDown,
  ClipboardList,
  FileText,
  History,
  CalendarDays,
  Image,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Package,
  Percent,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  TestTube2,
  Truck,
  SlidersHorizontal,
  ClipboardCheck,
  UploadCloud,
  Users,
  WalletCards,
  Wand2,
} from "lucide-react";
import { translateDomTree, useI18n } from "../../i18n";

const copy = {
  vi: {
    app: "Gundam Admin",
    desc: "CMS / Vận hành Ecommerce",
    dashboard: "Bảng điều khiển",
    storefrontCms: "CMS giao diện bán hàng",
    cmsOverview: "Tổng quan CMS",
    pages: "Trang nội dung",
    homeBuilder: "Thiết kế trang chủ",
    banners: "Biểu ngữ",
    news: "Tin tức",
    events: "Sự kiện",
    navigation: "Điều hướng",
    media: "Thư viện media",
    themeSeo: "Giao diện / SEO",
    productManagement: "Quản lý sản phẩm",
    inventoryOperations: "Vận hành tồn kho",
    pricingOperations: "Giá & khuyến mãi",
    products: "Sản phẩm",
    categories: "Danh mục sản phẩm",
    suppliers: "Nhà cung cấp",
    groups: "Nhóm sản phẩm",
    groupMapping: "Gán nhóm",
    pricing: "Giá bán",
    inventory: "Tồn kho",
    inventoryReceipts: "Nhập hàng",
    inventoryAdjustments: "Điều chỉnh tồn",
    stockCount: "Kiểm tồn",
    inventoryTransactions: "Lịch sử giao dịch",
    promotions: "Khuyến mãi",
    sales: "Bán hàng & đơn hàng",
    orders: "Đơn hàng",
    restockAlerts: "Báo hàng / Restock",
    customerService: "Chăm sóc khách hàng",
    communication: "Quản lý liên lạc",
    chats: "Hội thoại",
    reviews: "Đánh giá",
    gallery: "Gallery cộng đồng",
    complaints: "Khiếu nại",
    system: "Hệ thống",
    analytics: "Phân tích",
    settings: "Cài đặt",
    viewStore: "Xem cửa hàng",
    search: "Tìm trong admin...",
    qaHelper: "QA / SIT Helper",
  },
  en: {
    app: "Gundam Admin",
    desc: "CMS / Ecommerce Ops",
    dashboard: "Dashboard",
    storefrontCms: "Storefront CMS",
    cmsOverview: "CMS Overview",
    pages: "Pages",
    homeBuilder: "Home Builder",
    banners: "Banner",
    news: "News",
    events: "Events",
    navigation: "Navigation",
    media: "Media Library",
    themeSeo: "Theme / SEO",
    communication: "Communication",
    productManagement: "Product Management",
    inventoryOperations: "Inventory Operations",
    pricingOperations: "Pricing & Promotions",
    products: "Products",
    categories: "Product Categories",
    suppliers: "Suppliers",
    groups: "Product Groups",
    groupMapping: "Group Mapping",
    pricing: "Pricing",
    inventory: "Inventory",
    inventoryReceipts: "Goods Receipt",
    inventoryAdjustments: "Stock Adjustment",
    stockCount: "Stock Count",
    inventoryTransactions: "Transactions",
    promotions: "Promotions",
    sales: "Sales & Orders",
    orders: "Orders",
    restockAlerts: "Restock Alerts",
    customerService: "Customer Service",
    chats: "Chats",
    reviews: "Reviews",
    gallery: "Community Gallery",
    complaints: "Complaints",
    system: "System",
    analytics: "Analytics",
    settings: "Settings",
    viewStore: "View Store",
    search: "Search admin...",
    qaHelper: "QA / SIT Helper",
  },
};


function AdminDomTranslator({ lang }) {
  useEffect(() => {
    translateDomTree(document.body, lang);

    const observer = new MutationObserver(() => {
      translateDomTree(document.body, lang);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "title", "aria-label"],
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}

function AdminLogo({ t }) {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700 text-white">
        <Store size={21} />
      </div>
      <div>
        <div className="text-sm font-black text-slate-950">{t.app}</div>
        <div className="text-[11px] font-semibold text-slate-500">{t.desc}</div>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, exact = false }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-sm font-bold transition",
          isActive
            ? "border-blue-700 bg-blue-50 text-blue-700"
            : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950",
        ].join(" ")
      }
    >
      <Icon size={17} />
      <span>{label}</span>
    </NavLink>
  );
}

function NavGroup({ title, children }) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between px-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
        <span>{title}</span>
        <ChevronDown size={13} />
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function getPageTitle(pathname, t) {
  if (pathname === "/admin") return t.dashboard;
  if (pathname.includes("/admin/cms/pages")) return t.pages;
  if (pathname.includes("/admin/cms/home-builder")) return t.homeBuilder;
  if (pathname.includes("/admin/cms/banners")) return t.banners;
  if (pathname.includes("/admin/cms/navigation")) return t.navigation;
  if (pathname.includes("/admin/cms/media")) return t.media;
  if (pathname.includes("/admin/cms/theme-seo")) return t.themeSeo;
  if (pathname === "/admin/cms") return t.cmsOverview;
  if (pathname.includes("/admin/products")) return t.products;
  if (pathname.includes("/admin/product-categories")) return t.categories;
  if (pathname.includes("/admin/suppliers")) return t.suppliers;
  if (pathname.includes("/admin/product-groups")) return t.groups;
  if (pathname.includes("/admin/product-group-mapping")) return t.groupMapping;
  if (pathname.includes("/admin/pricing")) return t.pricing;
  if (pathname.includes("/admin/inventory/transactions")) return t.inventoryTransactions;
  if (pathname.includes("/admin/inventory/adjustments")) return t.inventoryAdjustments;
  if (pathname.includes("/admin/inventory/stock-count")) return t.stockCount;
  if (pathname.includes("/admin/inventory/receipts")) return t.inventoryReceipts;
  if (pathname.includes("/admin/inventory")) return t.inventory;
  if (pathname.includes("/admin/promotions")) return t.promotions;
  if (pathname.includes("/admin/orders")) return t.orders;
  if (pathname.includes("/admin/restock-alerts")) return t.restockAlerts;
  if (pathname.includes("/admin/news")) return t.news;
  if (pathname.includes("/admin/events")) return t.events;
  if (pathname.includes("/admin/chats")) return t.chats;
  if (pathname.includes("/admin/reviews")) return t.reviews;
  if (pathname.includes("/admin/community-gallery")) return t.gallery;
  if (pathname.includes("/admin/communication")) return t.communication;
  if (pathname.includes("/admin/complaints")) return t.complaints;
  if (pathname.includes("/admin/analytics")) return t.analytics;
  if (pathname.includes("/admin/settings")) return t.settings;
  if (pathname.includes("/admin/qa-helper")) return t.qaHelper;
  return t.dashboard;
}

export default function AdminLayout() {
  const { lang, setLang } = useI18n();
  const t = copy[lang] || copy.vi;
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname, t);

  return (
    <div className="admin-layout-shell min-h-screen bg-slate-100 text-slate-900">
      <AdminDomTranslator lang={lang} />
      <div className="grid min-h-screen lg:grid-cols-[268px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <AdminLogo t={t} />

          <nav className="px-3 py-4">
            <NavGroup title={t.dashboard}>
              <NavItem to="/admin" exact icon={LayoutDashboard} label={t.dashboard} />
            </NavGroup>

            <NavGroup title={t.storefrontCms}>
              <NavItem to="/admin/cms" icon={Store} label={t.cmsOverview} />
              <NavItem to="/admin/cms/pages" icon={FileText} label={t.pages} />
              <NavItem to="/admin/cms/home-builder" icon={ShoppingBag} label={t.homeBuilder} />
              <NavItem to="/admin/cms/banners" icon={Image} label={t.banners} />
              <NavItem to="/admin/news" icon={FileText} label={t.news} />
              <NavItem to="/admin/events" icon={CalendarDays} label={t.events} />
              <NavItem to="/admin/cms/navigation" icon={ClipboardList} label={t.navigation} />
              <NavItem to="/admin/cms/media" icon={UploadCloud} label={t.media} />
              <NavItem to="/admin/cms/theme-seo" icon={Wand2} label={t.themeSeo} />
            </NavGroup>

            <NavGroup title={t.productManagement}>
              <NavItem to="/admin/products" icon={Package} label={t.products} />
              <NavItem to="/admin/product-categories" icon={Tags} label={t.categories} />
              <NavItem to="/admin/suppliers" icon={Truck} label={t.suppliers} />
              <NavItem to="/admin/product-groups" icon={ShoppingCart} label={t.groups} />
              <NavItem to="/admin/product-group-mapping" icon={ClipboardList} label={t.groupMapping} />
            </NavGroup>

            <NavGroup title={t.inventoryOperations}>
              <NavItem to="/admin/inventory" icon={Package} label={t.inventory} />
              <NavItem to="/admin/inventory/receipts" icon={Truck} label={t.inventoryReceipts} />
              <NavItem to="/admin/inventory/adjustments" icon={SlidersHorizontal} label={t.inventoryAdjustments} />
              <NavItem to="/admin/inventory/stock-count" icon={ClipboardCheck} label={t.stockCount} />
              <NavItem to="/admin/inventory/transactions" icon={History} label={t.inventoryTransactions} />
            </NavGroup>

            <NavGroup title={t.pricingOperations}>
              <NavItem to="/admin/pricing" icon={WalletCards} label={t.pricing} />
              <NavItem to="/admin/promotions" icon={Percent} label={t.promotions} />
            </NavGroup>

            <NavGroup title={t.sales}>
              <NavItem to="/admin/orders" icon={ShoppingCart} label={t.orders} />
              <NavItem to="/admin/restock-alerts" icon={Bell} label={t.restockAlerts} />
            </NavGroup>

            <NavGroup title={t.customerService}>
              <NavItem to="/admin/chats" icon={MessageCircle} label={t.chats} />
              <NavItem to="/admin/reviews" icon={Star} label={t.reviews} />
              <NavItem to="/admin/community-gallery" icon={Image} label={t.gallery} />
              <NavItem to="/admin/complaints" icon={ShieldAlert} label={t.complaints} />
              <NavItem to="/admin/communication" icon={Megaphone} label={t.communication} />
            </NavGroup>

            <NavGroup title={t.system}>
              <NavItem to="/admin/analytics" icon={Activity} label={t.analytics} />
              <NavItem to="/admin/settings" icon={Settings} label={t.settings} />
              <NavItem to="/admin/qa-helper" icon={TestTube2} label={t.qaHelper} />
            </NavGroup>
          </nav>
        </aside>

        <main className="admin-main min-w-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
              <div>
                <div className="text-lg font-black text-slate-950">{pageTitle}</div>
                <div className="text-xs font-semibold text-slate-500">Gundam Store VN Admin V4</div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden items-center rounded-md border border-slate-300 bg-white px-3 py-2 md:flex">
                  <Search size={16} className="text-slate-400" />
                  <input className="w-56 bg-transparent px-2 text-sm outline-none" placeholder={t.search} />
                </div>


                <div className="flex rounded-md border border-slate-300 bg-slate-50 p-1">
                  {["vi", "en"].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLang(item)}
                      className={`rounded px-3 py-1.5 text-xs font-black uppercase transition ${lang === item
                        ? "bg-blue-700 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                        }`}
                    >
                      {item.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50">
                  <Bell size={18} />
                </button>

                <a
                  href="/"
                  className="rounded-md bg-blue-700 px-3 py-2 text-xs font-black text-white hover:bg-blue-800"
                >
                  {t.viewStore}
                </a>
              </div>
            </div>
          </header>

          <div className="admin-content p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
