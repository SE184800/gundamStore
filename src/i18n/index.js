import { useCms } from "../store/CmsStore";

export const SUPPORTED_LANGS = ["vi", "en"];

export function normalizeLang(lang) {
  return lang === "en" ? "en" : "vi";
}

export const STRINGS = {
  vi: {
    common: {
      vi: "VI",
      en: "EN",
      home: "Trang chủ",
      shop: "Trang bán hàng",
      products: "Sản phẩm",
      orders: "Đặt hàng",
      deals: "Ưu đãi",
      community: "Cộng đồng",
      support: "Hỗ trợ",
      admin: "Admin",
      account: "Tài khoản",
      searchPlaceholder: "Tìm kiếm Gundam, Gunpla, Model Kit...",
      quickSelect: "Chọn nhanh chức năng bên dưới",
      viewDetails: "Xem chi tiết",
      viewAll: "Xem tất cả",
      all: "Tất cả",
      send: "Gửi",
      policy: "Chính sách",
      contact: "Liên hệ",
      faq: "FAQ",
    },
    header: {
      allProducts: "Tất cả sản phẩm",
      allProductsDesc: "HG, RG, MG, PG và model kit",
      grades: "HG / RG / MG / PG",
      gradesDesc: "Lọc theo dòng sản phẩm",
      tools: "Phụ kiện & Tools",
      toolsDesc: "Kìm, nhám, action base, decal",
      newProducts: "Sản phẩm mới",
      newProductsDesc: "Hàng mới về trong tháng",
      preorder: "Pre-order",
      preorderDesc: "Mẫu đang mở đặt trước",
      orderItems: "Hàng order",
      orderItemsDesc: "Đặt mẫu theo yêu cầu",
      arrivalCalendar: "Lịch hàng về",
      arrivalCalendarDesc: "Cập nhật ETA và shipment",
      preorderPolicy: "Chính sách đặt trước",
      preorderPolicyDesc: "Cọc, ETA, thanh toán còn lại",
      promotions: "Khuyến mãi",
      promotionsDesc: "Tất cả chương trình ưu đãi",
      flashSale: "Flash sale",
      flashSaleDesc: "Deal giới hạn thời gian",
      voucher: "Voucher",
      voucherDesc: "Mã giảm giá và freeship",
      combo: "Combo builder",
      comboDesc: "Tool + decal + base tiết kiệm",
      news: "Tin tức",
      newsDesc: "Hàng mới, review, thông báo",
      events: "Sự kiện",
      eventsDesc: "Workshop, expo, livestream",
      contest: "Cuộc thi",
      contestDesc: "Build contest cộng đồng",
      buildGuide: "Hướng dẫn build",
      buildGuideDesc: "Tips cho builder mới",
      livestream: "Livestream",
      livestreamDesc: "Unbox, preorder opening",
      orderLookup: "Tra cứu đơn",
      orderLookupDesc: "Kiểm tra trạng thái đơn hàng",
      contactDesc: "Chat với shop",
      faqDesc: "Câu hỏi thường gặp",
      returnPolicy: "Đổi trả",
      returnPolicyDesc: "Chính sách hỗ trợ",
    },
    product: {
      quickView: "Xem nhanh",
      addCart: "Thêm giỏ",
      addToCart: "Thêm vào giỏ",
      buyNow: "Mua ngay",
      preorder: "Pre-order",
      inStock: "Hàng sẵn",
      stockReady: "Sẵn trong kho",
      preorderContact: "Pre-order / Liên hệ",
      details: "Chi tiết",
      defaultShort: "Hàng chính hãng Bandai.",
      defaultName: "Sản phẩm Gundam",
    },
    footer: {
      intro: "Gundam Store VN — điểm đến cho builder, collector và cộng đồng Gunpla.",
      location: "TP.HCM, Việt Nam",
      productGroup: "Sản phẩm",
      communityGroup: "Cộng đồng",
      supportGroup: "Hỗ trợ",
      newsletterTitle: "Nhận tin hàng mới",
      newsletterDesc: "Cập nhật preorder, restock, sự kiện và voucher cho builder.",
      emailPlaceholder: "Email của bạn",
      rights: "© 2026 Gundam Store VN. All rights reserved.",
    },
    chat: {
      aiWelcome:"",
      aiSamplePrompt:"",
      aiTab:"",
      staffTab:"",
      btnMain:"",
      btnSub:"",
      title: "",
      subtitle: "Tư vấn demo 24/7",
      botHello: "Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?",
      userDemo: "Tôi muốn xem sản phẩm bán chạy.",
      placeholder: "Nhập tin nhắn...",
      openDemo: "Mở hộp chat demo",
      staff: "Nhân viên",
      staffDesc: "Chat với CSKH",
      zaloDesc: "Mở Zalo shop",
      fbDesc: "Mở Messenger",
    },
  },

  en: {
    common: {
      vi: "VI",
      en: "EN",
      home: "Home",
      shop: "Shop",
      products: "Products",
      orders: "Orders",
      deals: "Deals",
      community: "Community",
      support: "Support",
      admin: "Admin",
      account: "Account",
      searchPlaceholder: "Search Gundam, Gunpla, Model Kit...",
      quickSelect: "Quick access below",
      viewDetails: "View details",
      viewAll: "View all",
      all: "All",
      send: "Send",
      policy: "Policy",
      contact: "Contact",
      faq: "FAQ",
    },
    header: {
      allProducts: "All products",
      allProductsDesc: "HG, RG, MG, PG and model kits",
      grades: "HG / RG / MG / PG",
      gradesDesc: "Filter by product grade",
      tools: "Accessories & Tools",
      toolsDesc: "Nippers, sanding tools, action bases, decals",
      newProducts: "New products",
      newProductsDesc: "New arrivals this month",
      preorder: "Pre-order",
      preorderDesc: "Items open for pre-order",
      orderItems: "Order items",
      orderItemsDesc: "Request items by demand",
      arrivalCalendar: "Arrival calendar",
      arrivalCalendarDesc: "ETA and shipment updates",
      preorderPolicy: "Pre-order policy",
      preorderPolicyDesc: "Deposit, ETA, remaining payment",
      promotions: "Promotions",
      promotionsDesc: "All discount campaigns",
      flashSale: "Flash sale",
      flashSaleDesc: "Limited-time deals",
      voucher: "Voucher",
      voucherDesc: "Discount codes and free shipping",
      combo: "Builder combo",
      comboDesc: "Tool + decal + base bundles",
      news: "News",
      newsDesc: "New arrivals, reviews and announcements",
      events: "Events",
      eventsDesc: "Workshops, expos and livestreams",
      contest: "Contest",
      contestDesc: "Community build contests",
      buildGuide: "Build guide",
      buildGuideDesc: "Tips for new builders",
      livestream: "Livestream",
      livestreamDesc: "Unboxing and pre-order openings",
      orderLookup: "Order lookup",
      orderLookupDesc: "Check order status",
      contactDesc: "Chat with the shop",
      faqDesc: "Frequently asked questions",
      returnPolicy: "Returns",
      returnPolicyDesc: "Support policy",
    },
    product: {
      quickView: "Quick view",
      addCart: "Add cart",
      addToCart: "Add to cart",
      buyNow: "Buy now",
      preorder: "Pre-order",
      inStock: "In stock",
      stockReady: "In stock",
      preorderContact: "Pre-order / Contact",
      details: "Details",
      defaultShort: "Authentic Bandai product.",
      defaultName: "Gundam product",
    },
    footer: {
      intro: "Gundam Store VN — a destination for builders, collectors and the Gunpla community.",
      location: "Ho Chi Minh City, Vietnam",
      productGroup: "Products",
      communityGroup: "Community",
      supportGroup: "Support",
      newsletterTitle: "Get new arrival updates",
      newsletterDesc: "Receive preorder, restock, event and voucher updates for builders.",
      emailPlaceholder: "Your email",
      rights: "© 2026 Gundam Store VN. All rights reserved.",
    },
    chat: {
      aiWelcome:"",
      aiSamplePrompt:"",
      aiTab:"",
      staffTab:"",
      btnMain:"",
      btnSub:"",
      title: "",
      subtitle: "Demo consultation 24/7",
      botHello: "Hello! Do you need Gundam advice, pre-order support or order checking?",
      userDemo: "I want to see best-selling products.",
      placeholder: "Type a message...",
      openDemo: "Open demo chat",
      staff: "Staff",
      staffDesc: "Chat with customer support",
      zaloDesc: "Open Zalo shop",
      fbDesc: "Open Messenger",
    },
  },
};

export const STATIC_TEXT_EN = {
  "Trang chủ": "Home",
  "Trang bán hàng": "Shop",
  "Sản phẩm": "Products",
  "Đặt hàng": "Orders",
  "Ưu đãi": "Deals",
  "Cộng đồng": "Community",
  "Hỗ trợ": "Support",
  "Tài khoản": "Account",
  "Tất cả": "All",
  "Tất cả sản phẩm": "All products",
  "Sản phẩm mới": "New products",
  "Hàng mới": "New arrivals",
  "Hàng mới về": "New arrivals",
  "Hàng order": "Order items",
  "Hàng bán chạy": "Best sellers",
  "Hàng Sales": "Sales",
  "Hàng sẵn": "In stock",
  "Khuyến mãi": "Promotions",
  "Phụ kiện & Tools": "Accessories & Tools",
  "Tra cứu đơn": "Order lookup",
  "Liên hệ": "Contact",
  "Chính sách": "Policy",
  "Chính sách đổi trả": "Return policy",
  "Đổi trả": "Returns",
  "Tin tức": "News",
  "Sự kiện": "Events",
  "Cuộc thi": "Contest",
  "Hướng dẫn build": "Build guide",
  "Chọn nhanh chức năng bên dưới": "Quick access below",
  "Mua ngay": "Buy now",
  "Đặt ngay": "Order now",
  "Đặt hàng ngay": "Buy now",
  "Đặt trước ngay": "Pre-order now",
  "Xem chi tiết": "View details",
  "Xem tất cả": "View all",
  "Xem thêm sản phẩm": "Load more products",
  "Thêm giỏ": "Add cart",
  "Thêm vào giỏ": "Add to cart",
  "Chi tiết": "Details",
  "Xem nhanh": "Quick view",
  "Yêu thích": "Wishlist",
  "Chia sẻ": "Share",
  "Sẵn trong kho": "In stock",
  "Pre-order / Liên hệ": "Pre-order / Contact",
  "Chính hãng": "Authentic",
  "Chính hãng Bandai": "Authentic Bandai",
  "Bandai chính hãng": "Authentic Bandai",
  "Giao nhanh": "Fast shipping",
  "Bọc chống sốc": "Shock-proof packing",
  "Đóng gói chống sốc": "Shock-proof packing",
  "Hộp nguyên vẹn": "Mint box care",
  "Minh bạch hàng": "Transparent sourcing",
  "Quà builder": "Builder perks",
  "Danh mục": "Category",
  "Dòng sản phẩm": "Product lines",
  "Ảnh danh mục nên upload dạng vuông 512 x 512 px.": "Category images should be uploaded as square 512 x 512 px.",
  "Ưu đãi nổi bật hôm nay.": "Today’s featured deal.",
  "Hàng chính hãng Bandai.": "Authentic Bandai product.",
  "Hàng chính hãng Bandai, số lượng có hạn.": "Authentic Bandai product, limited stock.",
  "Nhận tin hàng mới": "Get new arrival updates",
  "Email của bạn": "Your email",
  "Gửi": "Send",
  "Gundam Store VN — điểm đến cho builder, collector và cộng đồng Gunpla.": "Gundam Store VN — a destination for builders, collectors and the Gunpla community.",
  "TP.HCM, Việt Nam": "Ho Chi Minh City, Vietnam",
  "Cập nhật preorder, restock, sự kiện và voucher cho builder.": "Receive preorder, restock, event and voucher updates for builders.",
  "AI Chatbot": "AI Chatbot",
  "Tư vấn demo 24/7": "Demo consultation 24/7",
  "Xin chào! Bạn cần tư vấn Gundam, preorder hay kiểm tra đơn hàng?": "Hello! Do you need Gundam advice, pre-order support or order checking?",
  "Tôi muốn xem sản phẩm bán chạy.": "I want to see best-selling products.",
  "Nhập tin nhắn...": "Type a message...",
  "Mở hộp chat demo": "Open demo chat",
  "Nhân viên": "Staff",
  "Chat với CSKH": "Chat with customer support",
  "Mở Zalo shop": "Open Zalo shop",
  "Mở Messenger": "Open Messenger",
  "Thông tin sản phẩm": "Product information",
  "Thông số kỹ thuật": "Technical specs",
  "Đập hộp có gì?": "What’s in the box?",
  "Mô tả sản phẩm": "Product description",
  "Chính sách mua hàng": "Purchase policy",
  "Đổi trả & bảo hành": "Returns & warranty",
  "Đánh giá khách hàng": "Customer reviews",
  "Sản phẩm liên quan": "Related products",
  "Không tìm thấy sản phẩm": "Product not found",
  "Quay lại trang bán hàng": "Back to shop",
  "Runner nhựa đầy đủ": "Full plastic runners",
  "Runner nhựa": "Plastic runners",
  "Sách hướng dẫn Nhật": "Japanese instruction manual",
  "Sách hướng dẫn": "Instruction manual",
  "Sticker": "Sticker",
  "Decal sheet": "Decal sheet",
  "Beam Rifle": "Beam Rifle",
  "Shield": "Shield",
  "Beam Saber": "Beam Saber",
  "Beam Saber x2": "Beam Saber x2",
  "Wing parts": "Wing parts",
  "Stand connector": "Stand connector",
  "Base parts": "Base parts",
  "Connector parts": "Connector parts",
  "Dễ lắp, giá tốt, phù hợp người mới.": "Easy build, good price, beginner-friendly.",
  "Đế trưng bày trong suốt cho HG/RG.": "Clear display base for HG/RG kits.",
  "Mẫu RG kích thước lớn, form hầm hố, đang sale.": "Large RG kit, powerful form, on sale.",
  "Master Grade nổi bật, form đẹp, thích hợp trưng bày.": "Iconic Master Grade, beautiful form for display.",
  "Dòng MGEX cao cấp, độ chi tiết vượt trội, pre-order.": "Premium MGEX line, highly detailed, pre-order.",
  "Real Grade chi tiết cao, pose đẹp, hàng chính hãng Bandai.": "Highly detailed Real Grade, great posing, authentic Bandai kit.",
  "RG Hi-ν Gundam là một trong những mẫu Real Grade được cộng đồng Gunpla đánh giá cao nhờ chi tiết sắc nét, tỉ lệ đẹp và khả năng tạo dáng mạnh mẽ.": "RG Hi-ν Gundam is one of the most appreciated Real Grade kits in the Gunpla community thanks to sharp details, balanced proportions and strong posing ability.",
  "MG Freedom Ver.2.0 có khung inner frame tốt, màu sắc nổi bật và form cánh đẹp.": "MG Freedom Ver.2.0 has a solid inner frame, striking colors and a beautiful wing silhouette.",
  "MGEX Strike Freedom là lựa chọn nổi bật cho collector thích độ chi tiết cao và hiệu ứng vàng.": "MGEX Strike Freedom is a standout choice for collectors who love high detail and gold-effect parts.",
  "RG Sazabi có kích thước lớn hơn nhiều mẫu RG thông thường, rất hợp trưng bày.": "RG Sazabi is larger than many standard RG kits and is excellent for display.",
  "HG Aerial dễ lắp, tách màu tốt, phù hợp cho builder mới bắt đầu.": "HG Aerial is easy to build, has good color separation and is suitable for new builders.",
  "Action Base 5 giúp tạo dáng bay và trưng bày mô hình gọn gàng.": "Action Base 5 helps create flying poses and display kits neatly."
};


export const ADMIN_STATIC_TEXT_EN = {
  "Bảng điều khiển": "Dashboard",
  "CMS giao diện bán hàng": "Storefront CMS",
  "Tổng quan CMS": "CMS Overview",
  "Trang nội dung": "Pages",
  "Thiết kế trang chủ": "Home Builder",
  "Banner": "Banners",
  "Tin tức": "News",
  "Sự kiện": "Events",
  "Điều hướng": "Navigation",
  "Thư viện media": "Media Library",
  "Giao diện / SEO": "Theme / SEO",
  "Quản lý sản phẩm": "Product Management",
  "Sản phẩm": "Products",
  "Danh mục sản phẩm": "Product Categories",
  "Nhà cung cấp": "Suppliers",
  "Nhóm sản phẩm": "Product Groups",
  "Gán nhóm": "Group Mapping",
  "Giá & tồn kho": "Pricing & Inventory",
  "Khuyến mãi": "Promotions",
  "Bán hàng & đơn hàng": "Sales & Orders",
  "Đơn hàng": "Orders",
  "Chăm sóc khách hàng": "Customer Service",
  "Tin nhắn": "Chats",
  "Đánh giá": "Reviews",
  "Khiếu nại": "Complaints",
  "Hệ thống": "System",
  "Phân tích": "Analytics",
  "Cài đặt": "Settings",
  "Xem cửa hàng": "View Store",
  "Tìm trong admin...": "Search admin...",

  "Dashboard vận hành ecommerce": "Ecommerce operations dashboard",
  "Theo dõi doanh thu, đơn hàng, tồn kho, ticket CSKH, pre-order và hành vi khách hàng trong một màn hình vận hành.": "Track revenue, orders, inventory, support tickets, pre-orders and customer behavior in one operations screen.",
  "Xuất báo cáo": "Export report",
  "Tạo task": "Create task",
  "Doanh thu hôm nay": "Revenue today",
  "Đơn mới": "New orders",
  "Ticket chờ xử lý": "Pending tickets",
  "Sắp hết hàng": "Low stock",
  "cần xử lý": "Need action",
  "Khẩn cấp": "urgent",
  "Xu hướng doanh thu & chuyển đổi": "Revenue & conversion trend",
  "Xem xu hướng doanh thu và tỉ lệ chuyển đổi theo thời gian.": "View revenue and conversion trends over time.",
  "12 tháng gần nhất": "Last 12 months",
  "30 ngày gần nhất": "Last 30 days",
  "Hàng đợi xử lý": "Action queue",
  "Xem tất cả": "View all",
  "5 đơn Pre-order cần xác nhận cọc": "5 pre-orders need deposit confirmation",
  "Banner Hero T06 cần publish lúc 20:00": "T06 hero banner needs publishing at 20:00",
  "RG Hi-ν còn 2 sản phẩm khả dụng": "RG Hi-ν has 2 available items left",
  "12 đánh giá mới cần duyệt": "12 new reviews need approval",
  "Người phụ trách": "Owner",
  "Sản phẩm có hành vi tốt nhất": "Top behavior products",
  "Sản phẩm được xem nhiều, thêm giỏ nhiều và có doanh số tốt.": "Products with high views, add-to-cart activity and strong sales.",
  "Mở analytics": "Open analytics",
  "Sức khỏe hệ thống": "System health",
  "Trạng thái publish CMS": "CMS publish status",
  "Lưu trữ media": "Media storage",
  "Đồng bộ tồn kho": "Inventory sync",
  "Sự kiện analytics": "Analytics events",
  "Khỏe": "Healthy",
  "Demo base64 local": "Local base64 demo",
  "Chế độ demo": "Demo mode",
  "Đang tracking": "Tracking",
  "Cao": "High",
  "Trung bình": "Medium",
  "Thấp": "Low",
  "Lượt xem": "Views",
  "Thêm giỏ": "Add cart",
  "Đã bán": "Sold",
  "Xếp hạng": "Rating"
};

function getByPath(obj, key) {
  return String(key || "")
    .split(".")
    .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function keepOuterSpace(original, translated) {
  const start = String(original).match(/^\s*/)?.[0] || "";
  const end = String(original).match(/\s*$/)?.[0] || "";
  return `${start}${translated}${end}`;
}

export function translateStaticText(value, lang = "vi") {
  const currentLang = normalizeLang(lang);
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (currentLang === "vi") return raw;

  const trimmed = raw.trim();
  const dictionaries = { ...STATIC_TEXT_EN, ...ADMIN_STATIC_TEXT_EN };
  if (dictionaries[trimmed]) return keepOuterSpace(raw, dictionaries[trimmed]);

  let output = raw;
  Object.entries(dictionaries)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([vi, en]) => {
      if (output.includes(vi)) output = output.split(vi).join(en);
    });

  return output;
}

export function t(key, lang = "vi", fallback = "") {
  const currentLang = normalizeLang(lang);
  const value = getByPath(STRINGS[currentLang], key);
  if (value !== undefined) return value;

  const viValue = getByPath(STRINGS.vi, key);
  if (viValue !== undefined) return currentLang === "en" ? translateStaticText(viValue, "en") : viValue;

  return currentLang === "en" ? translateStaticText(fallback || key, "en") : fallback || key;
}

export function resolveText(value, lang = "vi", fallback = "") {
  const currentLang = normalizeLang(lang);

  if (value === null || value === undefined || value === "") {
    return currentLang === "en" ? translateStaticText(fallback, "en") : fallback;
  }

  if (typeof value === "string" || typeof value === "number") {
    return translateStaticText(String(value), currentLang);
  }

  if (typeof value === "object") {
    const next = value[currentLang] || value.vi || value.en || value.label || value.title || fallback;
    return typeof next === "string" ? translateStaticText(next, currentLang) : String(next || "");
  }

  return String(value || fallback || "");
}

export function useI18n() {
  const { state, actions } = useCms();
  const lang = normalizeLang(state?.settings?.lang);

  return {
    lang,
    setLang: actions.setLang,
    t: (key, fallback = "") => t(key, lang, fallback),
    text: (value, fallback = "") => resolveText(value, lang, fallback),
  };
}

function shouldSkipElement(element) {
  if (!element) return true;
  const tag = element.tagName;
  return ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"].includes(tag);
}

function translateTextNode(node, lang) {
  if (!node || !node.nodeValue || !node.nodeValue.trim()) return;
  const parent = node.parentElement;
  if (shouldSkipElement(parent)) return;

  if (!node.__i18nOriginalText) node.__i18nOriginalText = node.nodeValue;
  const original = node.__i18nOriginalText;
  const next = normalizeLang(lang) === "en" ? translateStaticText(original, "en") : original;

  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateElementAttributes(element, lang) {
  if (!element || shouldSkipElement(element)) return;

  ["placeholder", "title", "aria-label"].forEach((attr) => {
    if (!element.hasAttribute?.(attr)) return;

    const dataAttr = `data-i18n-original-${attr}`;
    if (!element.hasAttribute(dataAttr)) {
      element.setAttribute(dataAttr, element.getAttribute(attr) || "");
    }

    const original = element.getAttribute(dataAttr) || "";
    const next = normalizeLang(lang) === "en" ? translateStaticText(original, "en") : original;

    if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
  });
}

export function translateDomTree(root = document.body, lang = "vi") {
  if (typeof document === "undefined" || !root) return;

  document.documentElement.lang = normalizeLang(lang);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];

  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => translateTextNode(node, lang));

  const elements = root.querySelectorAll?.("[placeholder], [title], [aria-label]") || [];
  elements.forEach((element) => translateElementAttributes(element, lang));
}


// Backward compatibility for older AutoTranslate.jsx import.
// This keeps existing imports working after the new shared i18n refactor.
export function LegacyAutoTranslator() {
  const { lang } = useI18n();

  if (typeof window !== "undefined") {
    setTimeout(() => {
      translateDomTree(document.body, lang);
    }, 0);
  }

  return null;
}


// Compatibility provider for older patches.
// The current language state is stored in CmsStore, so this provider only keeps
// old <I18nProvider> wrappers from breaking the build.
export function I18nProvider({ children }) {
  return children;
}

// Common alias for older components that may import useLanguage/useTranslation.
export function useLanguage() {
  return useI18n();
}

export function useTranslation() {
  return useI18n();
}
