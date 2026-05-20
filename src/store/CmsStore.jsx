import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { seedNews } from "../data/news";
import { seedEvents } from "../data/events";
import {
  seedProducts,
  seedBanners,
  seedHomeSections,
  seedCategories,
  seedReviews,
  seedOrders,
  seedTickets,
  seedChats,
  seedAnalytics,
  seedProductCategoryMappings,
  seedProductDisplayMappings,
} from "../data/seed";

const STORAGE_KEY = "gundam_store_vn_v2_cms";

const initialState = {
  products: seedProducts,
  banners: seedBanners,
  news: seedNews,
  events: seedEvents,
  publishedHero: null,
  heroSettings: {
    layout: "v2",
    autoplay: true,
    interval: 4500,
    maxBanners: 5,
  },
  homeSections: seedHomeSections,
  categories: seedCategories,
  productCategoryMappings: seedProductCategoryMappings,
  productDisplayMappings: seedProductDisplayMappings,
  reviews: seedReviews,
  orders: seedOrders,
  tickets: seedTickets,
  chats: seedChats,
  analytics: seedAnalytics,
  settings: {
    lang: "vi",
    shopName: "Gundam Store VN",
    hotline: "0909 123 456",
    zalo: "https://zalo.me/",
    facebook: "https://www.facebook.com/gundamstorevn",
  },
  cart: [
    { productId: "prod-rg-hi-nu", qty: 1, selected: true },
    { productId: "prod-mg-freedom", qty: 1, selected: true },
    { productId: "prod-mgex-strike-freedom", qty: 1, selected: true }
  ],
};

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

const CmsContext = createContext(null);

export function CmsProvider({ children }) {
  const [state, setState] = useState(() => safeRead());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const actions = useMemo(() => ({
    setLang(lang) {
      setState((prev) => ({ ...prev, settings: { ...prev.settings, lang } }));
    },
    track(event, payload = {}) {
      const item = {
        id: makeId("evt"),
        event,
        page: payload.page || window.location.pathname,
        productId: payload.productId || "",
        source: payload.source || "website",
        meta: payload.meta || {},
        createdAt: Date.now(),
      };
      setState((prev) => ({ ...prev, analytics: [item, ...prev.analytics].slice(0, 500) }));
    },

    saveProduct(product) {
      setState((prev) => {
        const exists = prev.products.some((p) => p.id === product.id);
        const next = exists
          ? prev.products.map((p) => (p.id === product.id ? { ...p, ...product } : p))
          : [{ ...product, id: product.id || makeId("prod") }, ...prev.products];
        return { ...prev, products: next };
      });
    },
    deleteProduct(id) {
      setState((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== id),
        productCategoryMappings: (prev.productCategoryMappings || []).filter((m) => m.productId !== id),
        productDisplayMappings: (prev.productDisplayMappings || []).filter((m) => m.productId !== id),
      }));
    },

    saveCategory(category) {
      setState((prev) => {
        const exists = (prev.categories || []).some((c) => c.id === category.id);
        const next = exists
          ? prev.categories.map((c) => (c.id === category.id ? { ...c, ...category } : c))
          : [{ ...category, id: category.id || makeId("cat") }, ...(prev.categories || [])];
        return { ...prev, categories: next };
      });
    },
    deleteCategory(id) {
      setState((prev) => ({
        ...prev,
        categories: (prev.categories || []).filter((c) => c.id !== id),
        productCategoryMappings: (prev.productCategoryMappings || []).map((m) => ({
          ...m,
          categoryIds: (m.categoryIds || []).filter((categoryId) => categoryId !== id),
        })),
      }));
    },
    setProductCategories(productId, categoryIds) {
      setState((prev) => {
        const mappings = prev.productCategoryMappings || [];
        const exists = mappings.some((m) => m.productId === productId);
        const next = exists
          ? mappings.map((m) => (m.productId === productId ? { ...m, categoryIds } : m))
          : [{ productId, categoryIds }, ...mappings];
        return { ...prev, productCategoryMappings: next };
      });
    },
    setProductDisplayCollections(productId, collectionKeys) {
      setState((prev) => {
        const mappings = prev.productDisplayMappings || [];
        const exists = mappings.some((m) => m.productId === productId);
        const next = exists
          ? mappings.map((m) => (m.productId === productId ? { ...m, collectionKeys } : m))
          : [{ productId, collectionKeys }, ...mappings];
        return { ...prev, productDisplayMappings: next };
      });
    },

    publishHero() {
      setState((prev) => ({
        ...prev,
        publishedHero: {
          version: Date.now(),
          publishedAt: new Date().toISOString(),
          heroSettings: { ...(prev.heroSettings || {}) },
          banners: [...(prev.banners || [])],
        },
      }));
    },

    saveEvent(event) {
      setState((prev) => {
        const id = event.id || `event-${Date.now()}`;
        const exists = (prev.events || []).some((e) => e.id === id);
        const item = { ...event, id };

        return {
          ...prev,
          events: exists
            ? prev.events.map((e) => (e.id === id ? item : e))
            : [item, ...(prev.events || [])],
        };
      });
    },

    deleteEvent(id) {
      setState((prev) => ({
        ...prev,
        events: (prev.events || []).filter((e) => e.id !== id),
      }));
    },

    saveNewsArticle(article) {
      setState((prev) => {
        const id = article.id || `news-${Date.now()}`;
        const exists = (prev.news || []).some((n) => n.id === id);
        const item = { ...article, id };

        return {
          ...prev,
          news: exists
            ? prev.news.map((n) => (n.id === id ? item : n))
            : [item, ...(prev.news || [])],
        };
      });
    },

    deleteNewsArticle(id) {
      setState((prev) => ({
        ...prev,
        news: (prev.news || []).filter((n) => n.id !== id),
      }));
    },

    saveHeroSettings(settings) {
      setState((prev) => ({
        ...prev,
        heroSettings: {
          ...(prev.heroSettings || {}),
          ...settings,
        },
      }));
    },

    saveBanner(banner) {
      setState((prev) => {
        const exists = prev.banners.some((b) => b.id === banner.id);
        const next = exists
          ? prev.banners.map((b) => (b.id === banner.id ? { ...b, ...banner } : b))
          : [{ ...banner, id: banner.id || makeId("banner") }, ...prev.banners];
        return { ...prev, banners: next };
      });
    },
    deleteBanner(id) {
      setState((prev) => ({ ...prev, banners: prev.banners.filter((b) => b.id !== id) }));
    },

    updateHomeSection(id, patch) {
      setState((prev) => ({
        ...prev,
        homeSections: prev.homeSections.map((section) =>
          section.id === id ? { ...section, ...patch, layout: { ...section.layout, ...(patch.layout || {}) } } : section
        ),
      }));
    },
    addHomeSection(section) {
      setState((prev) => ({
        ...prev,
        homeSections: [{ ...section, id: section.id || makeId("section"), sort: prev.homeSections.length + 1 }, ...prev.homeSections],
      }));
    },
    deleteHomeSection(id) {
      setState((prev) => ({ ...prev, homeSections: prev.homeSections.filter((s) => s.id !== id) }));
    },

    addToCart(productId, qty = 1) {
      setState((prev) => {
        const exists = prev.cart.find((i) => i.productId === productId);
        const cart = exists
          ? prev.cart.map((i) => (i.productId === productId ? { ...i, qty: i.qty + qty, selected: true } : i))
          : [...prev.cart, { productId, qty, selected: true }];
        return { ...prev, cart };
      });
      actions.track("add_to_cart", { productId });
    },
    updateCartItem(productId, patch) {
      setState((prev) => ({ ...prev, cart: prev.cart.map((i) => (i.productId === productId ? { ...i, ...patch } : i)) }));
    },
    removeCartItem(productId) {
      setState((prev) => ({ ...prev, cart: prev.cart.filter((i) => i.productId !== productId) }));
      actions.track("remove_from_cart", { productId });
    },
    clearCart() {
      setState((prev) => ({ ...prev, cart: [] }));
    },

    createOrder(order) {
      const id = `GSVN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder = { ...order, id, status: "new", createdAt: new Date().toLocaleString("vi-VN") };
      setState((prev) => ({ ...prev, orders: [newOrder, ...prev.orders], cart: [] }));
      actions.track("order_created", { meta: { orderId: id, total: order.total } });
      return id;
    },
    updateOrder(id, patch) {
      setState((prev) => ({ ...prev, orders: prev.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
    },

    submitReview(review) {
      setState((prev) => ({ ...prev, reviews: [{ ...review, id: makeId("rev"), approved: false, createdAt: new Date().toISOString().slice(0, 10) }, ...prev.reviews] }));
      actions.track("review_submitted", { productId: review.productId });
    },
    approveReview(id) {
      setState((prev) => ({ ...prev, reviews: prev.reviews.map((r) => (r.id === id ? { ...r, approved: true } : r)) }));
    },
    deleteReview(id) {
      setState((prev) => ({ ...prev, reviews: prev.reviews.filter((r) => r.id !== id) }));
    },

    createTicket(ticket) {
      setState((prev) => ({
        ...prev,
        tickets: [{ ...ticket, id: makeId("TK"), status: "Mới", priority: ticket.priority || "Trung bình", createdAt: new Date().toISOString().slice(0, 10) }, ...prev.tickets],
      }));
      actions.track("support_ticket_created");
    },
    updateTicket(id, patch) {
      setState((prev) => ({ ...prev, tickets: prev.tickets.map((ticket) => (ticket.id === id ? { ...ticket, ...patch } : ticket)) }));
    },

    sendChatMessage(text, customer = "Guest") {
      let chatId = sessionStorage.getItem("gundam_chat_id");
      const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setState((prev) => {
        let chats = prev.chats;
        const existing = chatId ? chats.find((c) => c.id === chatId) : null;
        if (!existing) {
          chatId = makeId("chat");
          sessionStorage.setItem("gundam_chat_id", chatId);
          chats = [{ id: chatId, customer, status: "open", assignedTo: "AI", updatedAt: new Date().toLocaleString("vi-VN"), messages: [] }, ...chats];
        }
        chats = chats.map((c) =>
          c.id === chatId
            ? { ...c, updatedAt: new Date().toLocaleString("vi-VN"), messages: [...c.messages, { from: "customer", text, time }] }
            : c
        );
        return { ...prev, chats };
      });
      actions.track("chat_message_sent");
      setTimeout(() => {
        actions.replyChat(chatId, "Cảm ơn bạn. Shop đã nhận tin nhắn, AI/CSKH sẽ hỗ trợ ngay nhé.", "ai");
      }, 300);
      return chatId;
    },
    replyChat(chatId, text, from = "staff") {
      const time = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
      setState((prev) => ({
        ...prev,
        chats: prev.chats.map((c) =>
          c.id === chatId ? { ...c, updatedAt: new Date().toLocaleString("vi-VN"), messages: [...c.messages, { from, text, time }] } : c
        ),
      }));
      actions.track("staff_reply_sent");
    },

    exportData() {
      return JSON.stringify(state, null, 2);
    },
    importData(json) {
      const parsed = JSON.parse(json);
      setState({ ...initialState, ...parsed });
    },
    resetData() {
      localStorage.removeItem(STORAGE_KEY);
      setState(initialState);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [state]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error("useCms must be used inside CmsProvider");
  return ctx;
}

export function useLang() {
  const { state, actions } = useCms();
  return [state.settings.lang || "vi", actions.setLang];
}
