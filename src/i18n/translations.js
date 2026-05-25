export const SUPPORTED_LANGUAGES = ["vi", "en"];

export const translations = {
  vi: {
    nav: {
      home: "Trang chủ",
      products: "Sản phẩm",
      orders: "Đặt hàng",
      deals: "Ưu đãi",
      community: "Cộng đồng",
      support: "Hỗ trợ",
      account: "Tài khoản",
      cart: "Giỏ hàng",
      admin: "Admin"
    },

    search: {
      placeholder: "Tìm kiếm Gundam, Gunpla, Model Kit..."
    },

    menu: {
      productsEyebrow: "PRODUCTS",
      productsHelp: "Chọn nhanh chức năng bên dưới",
      allProducts: "Tất cả sản phẩm",
      allProductsDesc: "HG, RG, MG, PG và model kit",
      grades: "HG / RG / MG / PG",
      gradesDesc: "Lọc theo dòng sản phẩm",
      accessories: "Phụ kiện & Tools",
      accessoriesDesc: "Kìm, nhám, action base, decal",
      newProducts: "Sản phẩm mới",
      newProductsDesc: "Hàng mới về trong tháng"
    },

    hero: {
      eyebrow: "BUILD YOUR LEGEND",
      title: "GUNDAM / GUNPLA",
      subtitle: "RG Hi-v Gundam đã về hàng",
      description: "Hàng chính hãng Bandai, bọc chống sốc 3 lớp.",
      campaign: "CHIẾN DỊCH",
      hotArrival: "Hot arrival",
      official: "Chính hãng",
      fastDelivery: "Giao nhanh",
      shockproof: "Bọc chống sốc",
      buyNow: "MUA NGAY"
    },

    usp: {
      fastShippingTitle: "GIAO NHANH",
      fastShippingDesc: "Ship hỏa tốc 2H tại HCM & giao toàn quốc",
      boxCareTitle: "HỘP NGUYÊN VẸN",
      boxCareDesc: "Đóng gói kỹ càng, bảo vệ tuyệt đối",
      clearSourceTitle: "MINH BẠCH HÀNG",
      clearSourceDesc: "Cam kết hàng chính hãng, ghi rõ nguồn",
      builderPerksTitle: "QUÀ BUILDER",
      builderPerksDesc: "Tích điểm & nhận quà riêng cho thành viên"
    },

    section: {
      categoryEyebrow: "DANH MỤC",
      categoryTitle: "Dòng sản phẩm",
      categoryDesc: "Ảnh danh mục nên upload dạng vuông 512 × 512 px.",
      orderItems: "Hàng order",
      bestSeller: "Bán chạy",
      newArrivals: "Hàng mới về",
      viewAll: "Xem tất cả",
      viewAllArrow: "Xem tất cả →",
      new: "NEW",
      hot: "HOT"
    },

    loyalty: {
      title: "Khách hàng thân thiết",
      desc: "Tích điểm • Voucher • Hạng VIP"
    },

    product: {
      addToCart: "Thêm vào giỏ",
      buyNow: "Mua ngay",
      price: "Giá",
      quantity: "Số lượng",
      scale: "Tỉ lệ",
      grade: "Dòng",
      related: "Sản phẩm liên quan"
    }
  },

  en: {
    nav: {
      home: "Home",
      products: "Products",
      orders: "Orders",
      deals: "Deals",
      community: "Community",
      support: "Support",
      account: "Account",
      cart: "Cart",
      admin: "Admin"
    },

    search: {
      placeholder: "Search Gundam, Gunpla, Model Kit..."
    },

    menu: {
      productsEyebrow: "PRODUCTS",
      productsHelp: "Quickly choose a section below",
      allProducts: "All products",
      allProductsDesc: "HG, RG, MG, PG and model kits",
      grades: "HG / RG / MG / PG",
      gradesDesc: "Filter by product line",
      accessories: "Accessories & Tools",
      accessoriesDesc: "Nippers, sanding tools, action bases, decals",
      newProducts: "New products",
      newProductsDesc: "New arrivals this month"
    },

    hero: {
      eyebrow: "BUILD YOUR LEGEND",
      title: "GUNDAM / GUNPLA",
      subtitle: "RG Hi-v Gundam is back in stock",
      description: "Authentic Bandai products with 3-layer shockproof packing.",
      campaign: "CAMPAIGN",
      hotArrival: "Hot arrival",
      official: "Official",
      fastDelivery: "Fast delivery",
      shockproof: "Shockproof packing",
      buyNow: "SHOP NOW"
    },

    usp: {
      fastShippingTitle: "FAST SHIPPING",
      fastShippingDesc: "2H express in HCMC & nationwide delivery",
      boxCareTitle: "MINT BOX CARE",
      boxCareDesc: "Careful packing and box protection",
      clearSourceTitle: "CLEAR SOURCE",
      clearSourceDesc: "Authentic products with transparent info",
      builderPerksTitle: "BUILDER PERKS",
      builderPerksDesc: "Points & member-only gifts"
    },

    section: {
      categoryEyebrow: "CATEGORY",
      categoryTitle: "Product lines",
      categoryDesc: "Category image should be square 512 × 512 px.",
      orderItems: "Order items",
      bestSeller: "Best sellers",
      newArrivals: "New arrivals",
      viewAll: "View all",
      viewAllArrow: "View all →",
      new: "NEW",
      hot: "HOT"
    },

    loyalty: {
      title: "Loyalty club",
      desc: "Points • Vouchers • VIP tiers"
    },

    product: {
      addToCart: "Add to cart",
      buyNow: "Buy now",
      price: "Price",
      quantity: "Quantity",
      scale: "Scale",
      grade: "Grade",
      related: "Related products"
    }
  }
};

export function normalizeLanguage(language) {
  return String(language || "vi").toLowerCase() === "en" ? "en" : "vi";
}

export function getNestedValue(object, path) {
  return String(path)
    .split(".")
    .reduce((current, key) => {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) {
        return current[key];
      }

      return undefined;
    }, object);
}

export function t(language, key, params = {}) {
  const lang = normalizeLanguage(language);

  let value = getNestedValue(translations[lang], key);

  if (value === undefined) {
    value = getNestedValue(translations.vi, key);
  }

  if (value === undefined) {
    return key;
  }

  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
    return params[paramKey] ?? "";
  });
}

function flatten(object, prefix = "", output = {}) {
  Object.entries(object).forEach(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object") {
      flatten(value, nextKey, output);
    } else if (typeof value === "string") {
      output[nextKey] = value;
    }
  });

  return output;
}

const rawTextToKey = new Map();

Object.values(translations).forEach((dictionary) => {
  const flat = flatten(dictionary);

  Object.entries(flat).forEach(([key, value]) => {
    rawTextToKey.set(value, key);
  });
});

export function translateRawText(value, language) {
  if (!value) return value;

  const original = String(value);
  const trimmed = original.trim();

  if (!trimmed) return original;

  const key = rawTextToKey.get(trimmed);

  if (!key) return original;

  const translated = t(language, key);

  return original.replace(trimmed, translated);
}
