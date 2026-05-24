import AutoTranslate from "./components/common/AutoTranslate.jsx";
import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/storefront/HomePage";
import ShopPage from "./pages/storefront/ShopPage";
import AccessoriesPage from "./pages/storefront/AccessoriesPage";
import PromotionsPage from "./pages/storefront/PromotionsPage";
import CampaignCollectionPage from "./pages/storefront/CampaignCollectionPage";
import PreOrderPage from "./pages/storefront/PreOrderPage";
import BuildGuidePage from "./pages/storefront/BuildGuidePage";
import OrderLookupPage from "./pages/storefront/OrderLookupPage";
import FAQPage from "./pages/storefront/FAQPage";
import ReturnPolicyPage from "./pages/storefront/ReturnPolicyPage";
import ContactPage from "./pages/storefront/ContactPage";
import NewsPage from "./pages/storefront/NewsPage";
import NewsDetailPage from "./pages/storefront/NewsDetailPage";
import EventsPage from "./pages/storefront/EventsPage";
import EventDetailPage from "./pages/storefront/EventDetailPage";
import ProductDetailPage from "./pages/storefront/ProductDetailPage";
import CartPage from "./pages/storefront/CartPage";
import CheckoutPage from "./pages/storefront/CheckoutPage";
import OrderSuccessPage from "./pages/storefront/OrderSuccessPage";
import MyOrdersPage from "./pages/storefront/MyOrdersPage";
import OrderDetailPage from "./pages/storefront/OrderDetailPage";
import WishlistPage from "./pages/storefront/WishlistPage";
import CommunityGalleryPage from "./pages/storefront/CommunityGalleryPage";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStorefrontCMS from "./pages/admin/AdminStorefrontCMS";
import AdminCMSBanners from "./pages/admin/AdminCMSBanners";
import AdminNews from "./pages/admin/AdminNews";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminHomeBuilder from "./pages/admin/AdminHomeBuilder";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminProductCategoryMapping from "./pages/admin/AdminProductCategoryMapping";
import AdminProductDisplayMapping from "./pages/admin/AdminProductDisplayMapping";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminQaHelper from "./pages/admin/AdminQaHelper";
import AdminCommunityGallery from "./pages/admin/AdminCommunityGallery";
import AdminChats from "./pages/admin/AdminChats";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminComplaints from "./pages/admin/AdminComplaints";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProductCategories from "./pages/admin/AdminProductCategories";
import AdminSuppliers from "./pages/admin/AdminSuppliers";
import AdminProductGroups from "./pages/admin/AdminProductGroups";
import AdminProductGroupMapping from "./pages/admin/AdminProductGroupMapping";
import AdminPricingInventory from "./pages/admin/AdminPricingInventory";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminReports from "./pages/admin/AdminReports";

import HeaderCart from "./components/layout/HeaderCart";
import AddToCartBridge from "./components/cart/AddToCartBridge";

export default function App() {
  return (
    <>
      <AutoTranslate />

      <Routes>
        {/* Storefront */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/accessories" element={<AccessoriesPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />

        <Route path="/flash-sale" element={<CampaignCollectionPage type="flash-sale" />} />
        <Route path="/restock" element={<CampaignCollectionPage type="restock" />} />
        <Route path="/limited" element={<CampaignCollectionPage type="limited" />} />
        <Route path="/coming-soon" element={<CampaignCollectionPage type="coming-soon" />} />
        <Route path="/pre-order" element={<PreOrderPage />} />
        <Route path="/build-guide" element={<BuildGuidePage />} />
        <Route path="/community-gallery" element={<CommunityGalleryPage />} />
        <Route path="/order-lookup" element={<OrderLookupPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Content */}
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/events" element={<EventsPage />} />
        <Route path="/news/events/:id" element={<EventDetailPage />} />
        <Route path="/news/:slug" element={<NewsDetailPage />} />

        {/* Commerce */}
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:id" element={<OrderSuccessPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />

          <Route path="cms" element={<AdminStorefrontCMS />} />
          <Route path="cms/pages" element={<AdminStorefrontCMS />} />
          <Route path="cms/home-builder" element={<AdminStorefrontCMS />} />
          <Route path="cms/banners" element={<AdminCMSBanners />} />
          <Route path="cms/navigation" element={<AdminStorefrontCMS />} />
          <Route path="cms/media" element={<AdminStorefrontCMS />} />
          <Route path="cms/theme-seo" element={<AdminStorefrontCMS />} />

          <Route path="news" element={<AdminNews />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="home-builder" element={<AdminHomeBuilder />} />
          <Route path="banners" element={<AdminBanners />} />

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

          <Route path="orders" element={<AdminOrders />} />
          <Route path="chats" element={<AdminChats />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="community-gallery" element={<AdminCommunityGallery />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="qa-helper" element={<AdminQaHelper />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AddToCartBridge />
      <HeaderCart />
    </>
  );
}
