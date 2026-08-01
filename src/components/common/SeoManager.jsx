import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useCms, useLang } from "../../store/CmsStore";
import { absoluteImage, buildUrl, cleanText, SITE_CONFIG } from "../../config/seoConfig";
import { seedNews } from "../../data/news";
import { seedEvents } from "../../data/events";

function getName(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.vi || value.en || "";
}

function getProductImage(product) {
  return (
    product?.media?.detailMain ||
    product?.media?.card ||
    product?.imageUrl ||
    product?.images?.[0] ||
    SITE_CONFIG.defaultImage
  );
}

function getProductAvailability(product) {
  const status = String(product?.status || "").toLowerCase();
  const stock = Number(product?.stock ?? product?.inventory ?? 0);

  if (status.includes("pre") || product?.preorder?.enabled) {
    return "https://schema.org/PreOrder";
  }

  if (stock > 0) {
    return "https://schema.org/InStock";
  }

  return "https://schema.org/OutOfStock";
}

function setMeta(attr, key, content) {
  if (!content) return;

  let element = document.head.querySelector(`meta[${attr}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function setJsonLd(id, data) {
  const scriptId = `jsonld-${id}`;
  let element = document.getElementById(scriptId);

  if (!data) {
    if (element) element.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.id = scriptId;
    element.type = "application/ld+json";
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

function removeJsonLdExcept(validIds = []) {
  document.querySelectorAll('script[type="application/ld+json"][id^="jsonld-"]').forEach((item) => {
    if (!validIds.includes(item.id.replace("jsonld-", ""))) {
      item.remove();
    }
  });
}

function pageCopy(pathname, lang) {
  const vi = lang === "vi";

  if (pathname === "/") {
    return {
      title: vi ? "Gundam Store VN | Gunpla chính hãng" : "Gundam Store VN | Authentic Gunpla",
      description: vi
        ? "Mua Gunpla/Gundam chính hãng, hàng sẵn, pre-order, phụ kiện builder và ưu đãi cho collector."
        : "Shop authentic Gunpla/Gundam kits, in-stock products, pre-orders, builder tools and collector deals.",
    };
  }

  if (pathname === "/shop") {
    return {
      title: vi ? "Tất cả Gundam / Gunpla | Gundam Store VN" : "All Gundam / Gunpla | Gundam Store VN",
      description: vi
        ? "Lọc Gunpla theo grade, scale, series, tồn kho, pre-order và khoảng giá."
        : "Filter Gunpla by grade, scale, series, stock, pre-order status and price range.",
    };
  }

  if (pathname === "/pre-order") {
    return {
      title: vi ? "Pre-order Gundam / Gunpla | Gundam Store VN" : "Gundam / Gunpla Pre-order | Gundam Store VN",
      description: vi
        ? "Đặt hàng Gunpla pre-order, theo dõi ETA và thanh toán khi hàng về."
        : "Order Gunpla pre-orders, track ETA and pay when items arrive.",
    };
  }

  if (pathname === "/promotions") {
    return {
      title: vi ? "Khuyến mãi Gundam / Gunpla | Gundam Store VN" : "Gundam / Gunpla Promotions | Gundam Store VN",
      description: vi
        ? "Săn flash sale, restock, hàng limited, voucher và combo builder."
        : "Explore flash sale, restock, limited items, vouchers and builder combos.",
    };
  }

  if (pathname === "/flash-sale") {
    return {
      title: vi ? "Flash Sale Gunpla | Gundam Store VN" : "Gunpla Flash Sale | Gundam Store VN",
      description: vi ? "Săn deal Gunpla và phụ kiện builder trong thời gian ngắn." : "Limited-time deals for Gunpla kits and builder accessories.",
    };
  }

  if (pathname === "/restock") {
    return {
      title: vi ? "Hàng Gundam vừa restock | Gundam Store VN" : "Gundam Restock | Gundam Store VN",
      description: vi ? "Theo dõi các mẫu Gunpla hot vừa về lại kho." : "Track popular Gunpla kits back in stock.",
    };
  }

  if (pathname === "/limited") {
    return {
      title: vi ? "Limited / P-Bandai Gundam | Gundam Store VN" : "Limited / P-Bandai Gundam | Gundam Store VN",
      description: vi ? "Các mẫu limited, P-Bandai, The Gundam Base và special coating cho collector." : "Limited, P-Bandai, Gundam Base and special coating kits for collectors.",
    };
  }

  if (pathname === "/coming-soon") {
    return {
      title: vi ? "Gundam sắp về / sắp mở cọc | Gundam Store VN" : "Gundam Coming Soon / Pre-order Soon | Gundam Store VN",
      description: vi ? "Danh sách hàng sắp về, sắp mở cọc và đang chờ ETA." : "Upcoming arrivals, soon-to-open pre-orders and ETA tracking.",
    };
  }

  if (pathname === "/news") {
    return {
      title: vi ? "Tin tức Gunpla & Builder Hub | Gundam Store VN" : "Gunpla News & Builder Hub | Gundam Store VN",
      description: vi ? "Tin sản phẩm, pre-order, build guide, review, anime/lore và hoạt động cộng đồng." : "Product news, pre-order updates, build guides, reviews, anime/lore and community activities.",
    };
  }

  if (pathname === "/news/events") {
    return {
      title: vi ? "Lịch sự kiện Gunpla | Gundam Store VN" : "Gunpla Event Calendar | Gundam Store VN",
      description: vi ? "Workshop, build contest, livestream và offline cộng đồng Gunpla." : "Workshops, build contests, livestreams and Gunpla community meetups.",
    };
  }

  if (pathname === "/community-gallery") {
    return {
      title: vi ? "Gallery thành phẩm Gunpla cộng đồng | Gundam Store VN" : "Community Gunpla Build Gallery | Gundam Store VN",
      description: vi ? "Xem và chia sẻ thành phẩm Gunpla, custom paint, clean build và ý tưởng trưng bày." : "View and share Gunpla builds, custom paint, clean builds and display ideas.",
    };
  }

  if (pathname === "/wishlist") {
    return {
      title: vi ? "Wishlist Gunpla | Gundam Store VN" : "Gunpla Wishlist | Gundam Store VN",
      description: vi ? "Danh sách sản phẩm Gunpla yêu thích để theo dõi restock và pre-order." : "Saved Gunpla wishlist to track restock and pre-order opportunities.",
    };
  }

  if (pathname === "/compare") {
    return {
      title: vi ? "So sánh Gunpla | Gundam Store VN" : "Compare Gunpla Kits | Gundam Store VN",
      description: vi ? "So sánh giá, grade, scale, tồn kho và độ khó build." : "Compare price, grade, scale, stock and build difficulty.",
    };
  }

  if (pathname.startsWith("/admin") || pathname.includes("checkout") || pathname.includes("cart") || pathname.includes("orders")) {
    return {
      title: `${SITE_CONFIG.siteName}`,
      description: SITE_CONFIG.defaultDescription,
      noindex: true,
    };
  }

  return {
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.defaultDescription,
  };
}

function buildProductSeo(pathname, products, lang) {
  const match = pathname.match(/^\/product\/([^/]+)/);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]);
  const product = products.find((item) => item.slug === slug || item.id === slug);
  if (!product) return null;

  const name = getName(product.name, lang) || product.title || "Gundam Model Kit";
  const description = cleanText(getName(product.description, lang) || product.desc || SITE_CONFIG.defaultDescription);
  const image = absoluteImage(getProductImage(product));

  return {
    title: `${name} | Gundam Store VN`,
    description,
    image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      image: [image],
      description,
      sku: product.sku || product.id,
      brand: {
        "@type": "Brand",
        name: product.brand || "Bandai Spirits",
      },
      category: [product.grade, product.scale, "Gunpla"].filter(Boolean).join(" / "),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: Number(product.rating || 4.9),
        reviewCount: Number(product.reviewCount || product.reviews || 1),
      },
      offers: {
        "@type": "Offer",
        url: buildUrl(pathname),
        priceCurrency: "VND",
        price: Number(product.price || 0),
        availability: getProductAvailability(product),
        itemCondition: "https://schema.org/NewCondition",
        seller: {
          "@type": "Organization",
          name: SITE_CONFIG.siteName,
        },
      },
    },
  };
}

function buildArticleSeo(pathname, news, lang) {
  const match = pathname.match(/^\/news\/([^/]+)/);
  if (!match || pathname.startsWith("/news/events")) return null;

  const slug = decodeURIComponent(match[1]);
  const article = news.find((item) => item.slug === slug || item.id === slug);
  if (!article) return null;

  const title = article.title || SITE_CONFIG.defaultTitle;
  const description = cleanText(article.excerpt || article.desc || SITE_CONFIG.defaultDescription);
  const image = absoluteImage(article.image || SITE_CONFIG.defaultImage);

  return {
    title: `${title} | Gundam Store VN`,
    description,
    image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      image,
      datePublished: article.date || article.createdAt || new Date().toISOString(),
      dateModified: article.updatedAt || article.date || article.createdAt || new Date().toISOString(),
      author: {
        "@type": "Organization",
        name: SITE_CONFIG.siteName,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_CONFIG.siteName,
      },
      mainEntityOfPage: buildUrl(pathname),
    },
  };
}

function buildEventSeo(pathname, events, lang) {
  const match = pathname.match(/^\/news\/events\/([^/]+)/);
  if (!match) return null;

  const id = decodeURIComponent(match[1]);
  const event = events.find((item) => item.id === id || item.slug === id);
  if (!event) return null;

  const title = event.title || SITE_CONFIG.defaultTitle;
  const description = cleanText(event.desc || SITE_CONFIG.defaultDescription);
  const startDate = `${event.date || new Date().toISOString().slice(0, 10)}T${String(event.time || "09:00").slice(0, 5)}:00+07:00`;

  return {
    title: `${title} | Gundam Store VN`,
    description,
    image: absoluteImage(event.image || SITE_CONFIG.defaultImage),
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Event",
      name: title,
      description,
      startDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode:
        event.mode === "online" || event.mode === "livestream"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      location:
        event.mode === "online" || event.mode === "livestream"
          ? {
              "@type": "VirtualLocation",
              url: event.livestreamUrl || buildUrl(pathname),
            }
          : {
              "@type": "Place",
              name: event.location || SITE_CONFIG.siteName,
              address: event.address || "Ho Chi Minh City, Vietnam",
            },
      organizer: {
        "@type": "Organization",
        name: event.organizer || SITE_CONFIG.siteName,
        url: buildUrl("/"),
      },
      offers: {
        "@type": "Offer",
        price: event.fee && String(event.fee).includes("Miễn phí") ? 0 : 0,
        priceCurrency: "VND",
        availability: "https://schema.org/InStock",
        url: buildUrl(pathname),
      },
    },
  };
}

function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_CONFIG.siteName,
    url: buildUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${buildUrl("/shop")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.siteName,
    url: buildUrl("/"),
    logo: absoluteImage("/logo.png"),
    sameAs: [],
  };
}

export default function SeoManager() {
  const location = useLocation();
  const { state } = useCms();
  const [lang] = useLang();

  const seo = useMemo(() => {
    const products = state.products || [];
    const news = state.news?.length ? state.news : seedNews;
    const events = state.events?.length ? state.events : seedEvents;

    const productSeo = buildProductSeo(location.pathname, products, lang);
    if (productSeo) return productSeo;

    const articleSeo = buildArticleSeo(location.pathname, news, lang);
    if (articleSeo) return articleSeo;

    const eventSeo = buildEventSeo(location.pathname, events, lang);
    if (eventSeo) return eventSeo;

    return pageCopy(location.pathname, lang);
  }, [location.pathname, state.products, state.news, state.events, lang]);

  useEffect(() => {
    const title = seo.title || SITE_CONFIG.defaultTitle;
    const description = cleanText(seo.description || SITE_CONFIG.defaultDescription);
    const image = absoluteImage(seo.image || SITE_CONFIG.defaultImage);
    const canonical = buildUrl(location.pathname);

    document.documentElement.lang = lang === "en" ? "en" : "vi";
    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", seo.noindex ? "noindex,nofollow" : "index,follow");
    setMeta("name", "theme-color", "#0f172a");

    setMeta("property", "og:type", seo.jsonLd?.["@type"] === "Article" ? "article" : "website");
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:site_name", SITE_CONFIG.siteName);
    setMeta("property", "og:locale", lang === "en" ? "en_US" : "vi_VN");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);

    setLink("canonical", canonical);

    setJsonLd("website", buildWebsiteJsonLd());
    setJsonLd("organization", buildOrganizationJsonLd());
    setJsonLd("page", seo.jsonLd || null);
    removeJsonLdExcept(["website", "organization", "page"]);
  }, [seo, location.pathname, lang]);

  return null;
}
