import AutoTranslate from "./components/common/AutoTranslate.jsx";
import SeoManager from "./components/common/SeoManager";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// 🛠️ GIỮ LẠI CÁC ĐƯỜNG IMPORT KHÔNG DÙNG LAZY
import AddToCartBridge from "./components/cart/AddToCartBridge";
import Login from "./components/Login"; // Route Login mới tinh của bạn
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";

// 🛠️ DANH SÁCH LAZY LOADING (Đã dọn dẹp sạch sẽ, không bị trùng với import tĩnh)
const HomePage = lazy(() => import("./pages/storefront/HomePage"));
const ShopPage = lazy(() => import("./pages/storefront/ShopPage"));
const AccessoriesPage = lazy(() => import("./pages/storefront/AccessoriesPage"));
const PromotionsPage = lazy(() => import("./pages/storefront/PromotionsPage"));
const CampaignCollectionPage = lazy(() => import("./pages/storefront/CampaignCollectionPage"));
const PreOrderPage = lazy(() => import("./pages/storefront/PreOrderPage"));
const BuildGuidePage = lazy(() => import("./pages/storefront/BuildGuidePage"));
const CommunityGalleryPage = lazy(() => import("./pages/storefront/CommunityGalleryPage"));
const OrderLookupPage = lazy(() => import("./pages/storefront/OrderLookupPage"));
const MyOrdersPage = lazy(() => import("./pages/storefront/MyOrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/storefront/OrderDetailPage"));
const WishlistPage = lazy(() => import("./pages/storefront/WishlistPage"));
const ComparePage = lazy(() => import("./pages/storefront/ComparePage"));
const FAQPage = lazy(() => import("./pages/storefront/FAQPage"));
const ReturnPolicyPage = lazy(() => import("./pages/storefront/ReturnPolicyPage"));
const ContactPage = lazy(() => import("./pages/storefront/ContactPage"));
const NewsPage = lazy(() => import("./pages/storefront/NewsPage"));
const NewsDetailPage = lazy(() => import("./pages/storefront/NewsDetailPage"));
const EventsPage = lazy(() => import("./pages/storefront/EventsPage"));
const EventDetailPage = lazy(() => import("./pages/storefront/EventDetailPage"));
const ProductDetailPage = lazy(() => import("./pages/storefront/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/storefront/CartPage"));
const CheckoutPage = lazy(() => import("./pages/storefront/CheckoutPage"));
const OrderSuccessPage = lazy(() => import("./pages/storefront/OrderSuccessPage"));

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminAccessDeniedPage = lazy(() => import("./pages/admin/AdminAccessDeniedPage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminStorefrontCMS = lazy(() => import("./pages/admin/AdminStorefrontCMS"));
const AdminCMSBanners = lazy(() => import("./pages/admin/AdminCMSBanners"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const AdminEvents = lazy(() => import("./pages/admin/AdminEvents"));
const AdminHomeBuilder = lazy(() => import("./pages/admin/AdminHomeBuilder"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminProductCategories = lazy(() => import("./pages/admin/AdminProductCategories"));
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminProductGroups = lazy(() => import("./pages/admin/AdminProductGroups"));
const AdminProductGroupMapping = lazy(() => import("./pages/admin/AdminProductGroupMapping"));
const AdminPricingInventory = lazy(() => import("./pages/admin/AdminPricingInventory"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminProductCategoryMapping = lazy(() => import("./pages/admin/AdminProductCategoryMapping"));
const AdminProductDisplayMapping = lazy(() => import("./pages/admin/AdminProductDisplayMapping"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminChats = lazy(() => import("./pages/admin/AdminChats"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminCommunityGallery = lazy(() => import("./pages/admin/AdminCommunityGallery"));
const AdminRestockAlerts = lazy(() => import("./pages/admin/AdminRestockAlerts"));
const AdminComplaints = lazy(() => import("./pages/admin/AdminComplaints"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminQaHelper = lazy(() => import("./pages/admin/AdminQaHelper"));
const AdminCommunication = lazy(() => import("./pages/admin/AdminCommunication"));

function RouteLoading() {
  return (
    <div className="min-h-[60vh] bg-[#F5F7FB] px-4 py-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="animate-pulse rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-36 rounded-full bg-slate-200" />
          <div className="mt-5 h-10 w-2/3 rounded-2xl bg-slate-200" />
          <div className="mt-4 h-4 w-1/2 rounded-full bg-slate-200" />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="h-48 rounded-3xl bg-slate-100" />
            <div className="h-48 rounded-3xl bg-slate-100" />
            <div className="h-48 rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <AutoTranslate />
      <SeoManager />

      <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* 🛒 Storefront Core Routes (Đã dọn dẹp sạch sẽ trùng lặp) */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/accessories" element={<AccessoriesPage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          
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
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/return-policy" element={<ReturnPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />

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

          {/* 🔐 Admin Module (Grouped & Protected) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
            <Route path="banners" element={<AdminBanners />} />

            {/* Catalog & Logistics */}
            <Route path="products" element={<AdminProducts />} />
            <Route path="product-categories" element={<AdminProductCategories />} />
            <Route path="suppliers" element={<AdminSuppliers />} />
            <Route path="product-groups" element={<AdminProductGroups />} />
            <Route path="product-group-mapping" element={<AdminProductGroupMapping />} />
            <Route path="pricing-inventory" element={<AdminPricingInventory />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="product-category-mapping" element={<AdminProductCategoryMapping />} />
            <Route path="product-display-mapping" element={<AdminProductDisplayMapping />} />

            {/* Customer Operations */}
            <Route path="orders" element={<AdminOrders />} />
            <Route path="chats" element={<AdminChats />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="community-gallery" element={<AdminCommunityGallery />} />
            <Route path="restock-alerts" element={<AdminRestockAlerts />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="qa-helper" element={<AdminQaHelper />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <AddToCartBridge />
    </>
  );
}