import { useEffect } from "react";

const DEFAULT_TITLE = "Gundam Store VN";
const DEFAULT_DESCRIPTION = "Gundam / Gunpla ecommerce store with product catalog, checkout, order tracking and customer support.";

function setMeta(name, content, attr = "name") {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export default function SeoMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = "/og-default.png",
  canonical = "",
}) {
  useEffect(() => {
    const finalTitle = title.includes("Gundam Store VN") ? title : `${title} | Gundam Store VN`;
    const finalDescription = description || DEFAULT_DESCRIPTION;
    const finalUrl = canonical || window.location.href;

    document.title = finalTitle;

    setMeta("description", finalDescription);
    setMeta("og:title", finalTitle, "property");
    setMeta("og:description", finalDescription, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", finalUrl, "property");
    setMeta("og:image", image, "property");
    setMeta("twitter:card", "summary_large_image");

    let link = document.head.querySelector('link[rel="canonical"]');

    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }

    link.setAttribute("href", finalUrl);
  }, [title, description, image, canonical]);

  return null;
}
