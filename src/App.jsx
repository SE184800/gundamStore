import AutoTranslate from "./components/common/AutoTranslate.jsx";
import { Gift, Home, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import SeoManager from "./components/common/SeoManager";
import { lazy, Suspense, useEffect } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
// 🛠️ GIỮ LẠI CÁC ĐƯỜNG IMPORT KHÔNG DÙNG LAZY
import AddToCartBridge from "./components/cart/AddToCartBridge";
import { useI18n } from "./i18n";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
// 🛠️ DANH SÁCH LAZY LOADING (Đã dọn dẹp sạch sẽ, không bị trùng với import tĩnh)
const Register = lazy(() => import("./components/Register.jsx"));
const Login = lazy(() => import("./components/Login"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./components/ResetPassword.jsx"));
const HomePage = lazy(() => import("./pages/storefront/HomePage"));
const ShopPage = lazy(() => import("./pages/storefront/ShopPage"));
const AccessoriesPage = lazy(() => import("./pages/storefront/AccessoriesPage"));
const PromotionsPage = lazy(() => import("./pages/storefront/PromotionsPage"));
const CampaignCollectionPage = lazy(() => import("./pages/storefront/CampaignCollectionPage"));
const PreOrderPage = lazy(() => import("./pages/storefront/PreOrderPage"));
const BuildGuidePage = lazy(() => import("./pages/storefront/BuildGuidePage"));
const CommunityGalleryPage = lazy(() => import("./pages/storefront/CommunityGalleryPage"));
const OrderLookupPage = lazy(() => import("./pages/storefront/OrderLookupPage"));
const AccountDashboardPage = lazy(() => import("./pages/storefront/AccountDashboardPage"));
const AccountProfilePage = lazy(() => import("./pages/storefront/AccountProfilePage"));
const MyOrdersPage = lazy(() => import("./pages/storefront/MyOrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/storefront/OrderDetailPage"));
const WishlistPage = lazy(() => import("./pages/storefront/WishlistPage"));
const ComparePage = lazy(() => import("./pages/storefront/ComparePage"));
const FAQPage = lazy(() => import("./pages/storefront/FAQPage"));
const ReturnPolicyPage = lazy(() => import("./pages/storefront/ReturnPolicyPage"));
const AboutPage = lazy(() => import("./pages/storefront/AboutPage"));
const NewsPage = lazy(() => import("./pages/storefront/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/storefront/NewsDetailPage"));
const EventsPage = lazy(() => import("./pages/storefront/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/storefront/EventDetailPage"));
const ProductDetailPage = lazy(() => import("./pages/storefront/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/storefront/CartPage"));
const CheckoutPage = lazy(() => import("./pages/storefront/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/storefront/OrderSuccessPage"));

const StorefrontSupportPage = lazy(() => import("./pages/storefront/StorefrontSupportPage"));
const PolicyPage = lazy(() => import("./pages/storefront/PolicyPage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminChangePasswordPage = lazy(() => import("./pages/admin/AdminChangePasswordPage"));
const AdminAccessDeniedPage = lazy(() => import("./pages/admin/AdminAccessDeniedPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminStorefrontCMS = lazy(() => import("./pages/admin/AdminStorefrontCMS"));
const AdminCMSBanners = lazy(() => import("./pages/admin/AdminCMSBanners"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminHomeBuilder = lazy(() => import("./pages/admin/AdminHomeBuilder"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductCategories = lazy(() => import("./pages/admin/AdminProductCategories"));
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminProductGroups = lazy(() => import("./pages/admin/AdminProductGroups"));
const AdminProductGroupMapping = lazy(() => import("./pages/admin/AdminProductGroupMapping"));
const AdminPricing = lazy(() => import("./pages/admin/AdminPricing"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminInventoryReceipts = lazy(() => import("./pages/admin/AdminInventoryReceipts"));
const AdminInventoryStockCount = lazy(() => import("./pages/admin/AdminInventoryStockCount"));
const AdminInventoryAdjustments = lazy(() => import("./pages/admin/AdminInventoryAdjustments"));
const AdminInventoryTransactions = lazy(() => import("./pages/admin/AdminInventoryTransactions"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminFlashSales = lazy(() => import("./pages/admin/AdminFlashSales"));
const AdminVouchers = lazy(() => import("./pages/admin/AdminVouchers"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProductCategoryMapping = lazy(() => import("./pages/admin/AdminProductCategoryMapping"));
const AdminProductDisplayMapping = lazy(() => import("./pages/admin/AdminProductDisplayMapping"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminFulfillment = lazy(() => import("./pages/admin/AdminFulfillment"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminChats = lazy(() => import("./pages/admin/AdminChats"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminCommunityGallery = lazy(() => import("./pages/admin/AdminCommunityGallery"));
const AdminRestockAlerts = lazy(() => import("./pages/admin/AdminRestockAlerts"));
const AdminComplaints = lazy(() => import("./pages/admin/AdminComplaints"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminQaHelper = lazy(() => import("./pages/admin/AdminQaHelper"));
const AdminCommunication = lazy(() => import("./pages/admin/AdminCommunication"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function isGlobalMobileTabActive(pathname, item) {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/news") return pathname === "/news" || pathname.startsWith("/news/");
  if (item.extraMatch?.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function GlobalMobileBottomTabs() {
  const location = useLocation();
  const { t } = useI18n();
  const pathname = location.pathname || "/";

  if (pathname.startsWith("/admin")) return null;

  const items = [
    {
      label: t("common.home") || "Home",
      href: "/",
      icon: Home,
    },
    {
      label: t("common.products") || "Sản phẩm",
      href: "/shop",
      icon: Package,
      extraMatch: ["/product"],
    },
    {
      label: t("common.orders") || "Đặt hàng",
      href: "/pre-order",
      icon: ShoppingBag,
      extraMatch: ["/orders", "/order-success"],
    },
    {
      label: t("common.deals") || "Ưu đãi",
      href: "/promotions",
      icon: Gift,
      extraMatch: ["/flash-sale", "/restock", "/limited", "/coming-soon"],
    },
    {
      label: t("common.support") || "Hỗ trợ",
      href: "/order-lookup",
      icon: ShieldCheck,
      extraMatch: ["/support", "/contact", "/faq", "/return-policy", "/return-request", "/shipping-policy", "/payment-guide", "/warranty"],
    },
  ];

  return (
    <nav className="mobile-bottom-tabs md:hidden" aria-label="Mobile bottom navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const active = isGlobalMobileTabActive(pathname, item);

        return (
          <Link
            key={item.href}
            to={item.href}
            className={`mobile-bottom-tab-item ${active ? "is-active" : ""}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function RouteLoading() {
  return (
    <div className="min-h-[60vh] bg-[#F5F7FB] px-4 py-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-200" />
          <div className="mt-5 h-10 w-2/3 rounded-lg bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-48 rounded-lg bg-slate-100" />
            <div className="h-48 rounded-lg bg-slate-100" />
            <div className="h-48 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <AutoTranslate />
      <SeoManager />

      <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* 🛒 Storefront Core Routes (Đã dọn dẹp sạch sẽ trùng lặp) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {/* Campaign Collections */}
          <Route path="/flash-sale" element={<CampaignCollectionPage type="flash-sale" />} />
          <Route path="/restock" element={<CampaignCollectionPage type="restock" />} />
          <Route path="/limited" element={<CampaignCollectionPage type="limited" />} />
          <Route path="/coming-soon" element={<CampaignCollectionPage type="coming-soon" />} />

          {/* Customer Service & Pages */}
          <Route path="/pre-order" element={<PreOrderPage />} />
          <Route path="/build-guide" element={<BuildGuidePage />} />
          <Route path="/community-gallery" element={<CommunityGalleryPage />} />
          <Route path="/order-lookup" element={<OrderLookupPage />} />
          <Route path="/profile" element={<AccountProfilePage />} />
          <Route path="/account" element={<AccountDashboardPage />} />
          <Route path="/account/profile" element={<AccountProfilePage />} />
          <Route path="/account/addresses" element={<Navigate to="/account/profile#address" replace />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/favorites" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/return-policy" element={<PolicyPage pageKey="return-policy" />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Content & Blogs */}
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/events" element={<EventsPage />} />
          <Route path="/news/events/:id" element={<EventDetailPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />

          {/* Commerce Processes */}
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />

          {/* Support & Trust Pages */}
          <Route path="/contact" element={<StorefrontSupportPage defaultType="COMPLAINT" />} />
          <Route path="/support" element={<StorefrontSupportPage defaultType="COMPLAINT" />} />
          <Route path="/return-request" element={<StorefrontSupportPage defaultType="RETURN" />} />
          <Route path="/shipping-policy" element={<PolicyPage pageKey="shipping-policy" />} />
          <Route path="/payment-guide" element={<PolicyPage pageKey="payment-guide" />} />
          <Route path="/warranty" element={<PolicyPage pageKey="warranty" />} />
          <Route path="/faq" element={<PolicyPage pageKey="faq" />} />

          {/* 🔐 Admin Module (Grouped & Protected) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/change-password" element={<AdminChangePasswordPage />} />
          <Route path="/admin/access-denied" element={<AdminAccessDeniedPage />} />

          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="communication" element={<AdminCommunication />} />

            {/* CMS Sub-routes */}
            <Route path="cms" element={<AdminStorefrontCMS />} />
            <Route path="cms/pages" element={<AdminStorefrontCMS />} />
            <Route path="cms/home-builder" element={<AdminStorefrontCMS />} />
            <Route path="cms/banners" element={<AdminCMSBanners />} />
            <Route path="cms/navigation" element={<AdminStorefrontCMS />} />
            <Route path="cms/media" element={<AdminStorefrontCMS />} />
            <Route path="cms/theme-seo" element={<AdminStorefrontCMS />} />

            {/* Content Management */}
            <Route path="news" element={<AdminNews />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="home-builder" element={<AdminHomeBuilder />} />
            <Route path="banners" element={<Navigate to="/admin/cms/banners" replace />} />

            {/* Catalog & Logistics */}
            <Route path="products" element={<AdminProducts />} />
            <Route path="product-categories" element={<AdminProductCategories />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="product-groups" element={<AdminProductGroups />} />
            <Route path="product-group-mapping" element={<AdminProductGroupMapping />} />
            <Route path="pricing-inventory" element={<Navigate to="/admin/pricing" replace />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="inventory/receipts" element={<AdminInventoryReceipts />} />

            <Route path="inventory/adjustments" element={<AdminInventoryAdjustments />} />
            <Route path="inventory/stock-count" element={<AdminInventoryStockCount />} />
            <Route path="inventory/transactions" element={<AdminInventoryTransactions />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="flash-sales" element={<AdminFlashSales />} />
            <Route path="vouchers" element={<AdminVouchers />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="product-category-mapping" element={<AdminProductCategoryMapping />} />
            <Route path="product-display-mapping" element={<AdminProductDisplayMapping />} />

            {/* Customer Operations */}
            <Route path="orders" element={<AdminOrders />} />
            <Route path="shipping" element={<AdminShipping />} />
            <Route path="fulfillment" element={<AdminFulfillment />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="chats" element={<AdminChats />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="community-gallery" element={<AdminCommunityGallery />} />
            <Route path="restock-alerts" element={<AdminRestockAlerts />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="qa-helper" element={<AdminQaHelper />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <AddToCartBridge />
      <GlobalMobileBottomTabs />
    </>
  );
}
