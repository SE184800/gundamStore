from pathlib import Path

file = Path("src/data/seed.js")
text = file.read_text()

backup = Path("src/data/seed.js.bak-demo")
backup.write_text(text)

product_images = {
    "prod-rg-hi-nu": "/images/products/hi-nu.jpg",
    "prod-mg-freedom": "/images/products/freedom.jpg",
    "prod-mgex-strike-freedom": "/images/products/strike-freedom.jpg",
    "prod-hg-aerial": "/images/products/aerial.jpg",
    "prod-rg-sazabi": "/images/products/sazabi.jpg",
    "prod-pg-unicorn": "/images/products/unicorn.jpg",
}

def find_object_bounds(src, marker):
    pos = src.find(marker)
    if pos == -1:
        return None

    start = src.rfind("{", 0, pos)
    if start == -1:
        return None

    depth = 0
    in_str = None
    escape = False

    for i in range(start, len(src)):
        ch = src[i]

        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            continue

        if ch in ("'", '"', "`"):
            in_str = ch
            continue

        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return start, i + 1

    return None

def remove_property(obj, prop):
    idx = obj.find(prop + ":")
    if idx == -1:
        return obj

    start = idx
    value_start = obj.find(":", idx) + 1

    depth = 0
    in_str = None
    escape = False
    end = value_start

    for i in range(value_start, len(obj)):
        ch = obj[i]

        if in_str:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == in_str:
                in_str = None
            continue

        if ch in ("'", '"', "`"):
            in_str = ch
            continue

        if ch in "[{(":
            depth += 1
        elif ch in "]})":
            if depth == 0:
                end = i
                break
            depth -= 1
        elif ch == "," and depth == 0:
            end = i + 1
            break

    return obj[:start] + obj[end:]

def patch_product_object(obj, image):
    obj = remove_property(obj, "imageUrl")
    obj = remove_property(obj, "media")
    obj = remove_property(obj, "images")

    insert = f'''
    imageUrl: "{image}",
    media: {{
      card: "{image}",
      home: "{image}",
      detailMain: "{image}",
      gallery: ["{image}"],
      hover: "{image}",
      box: "{image}",
    }},
    images: ["{image}"],
'''

    return obj[:-1] + insert + obj[-1:]

for product_id, image in product_images.items():
    bounds = find_object_bounds(text, f'id: "{product_id}"')
    if not bounds:
        continue

    start, end = bounds
    obj = text[start:end]
    patched = patch_product_object(obj, image)
    text = text[:start] + patched + text[end:]

demo_banners = '''export const seedBanners = [
  {
    id: "banner-hero-1",
    title: { vi: "RG Hi-ν Gundam đã về hàng", en: "RG Hi-ν Gundam Back in Stock" },
    subtitle: { vi: "Hàng chính hãng Bandai, bọc chống sốc 3 lớp.", en: "Authentic Bandai, carefully packed." },
    imageUrl: "/images/banners/banner-1.jpg",
    placement: "Homepage Hero",
    status: "Live",
    active: true,
    ctaText: { vi: "Mua ngay", en: "Shop now" },
    ctaUrl: "/shop",
  },
  {
    id: "banner-hero-2",
    title: { vi: "Pre-order MGEX Strike Freedom", en: "Pre-order MGEX Strike Freedom" },
    subtitle: { vi: "Cọc trước, theo dõi ETA rõ ràng.", en: "Track ETA clearly after preorder." },
    imageUrl: "/images/banners/banner-2.jpg",
    placement: "Homepage Hero",
    status: "Live",
    active: true,
    ctaText: { vi: "Đặt trước", en: "Pre-order" },
    ctaUrl: "/shop",
  },
  {
    id: "banner-hero-3",
    title: { vi: "Builder Tools & Decal", en: "Builder Tools & Decal" },
    subtitle: { vi: "Đầy đủ phụ kiện cho builder chuyên nghiệp.", en: "Professional builder accessories." },
    imageUrl: "/images/banners/banner-3.jpg",
    placement: "Homepage Hero",
    status: "Live",
    active: true,
    ctaText: { vi: "Xem thêm", en: "Explore" },
    ctaUrl: "/shop",
  },
];'''

start = text.find("export const seedBanners =")
if start != -1:
    arr_start = text.find("[", start)
    depth = 0
    end = arr_start
    for i in range(arr_start, len(text)):
        if text[i] == "[":
            depth += 1
        elif text[i] == "]":
            depth -= 1
            if depth == 0:
                semi = text.find(";", i)
                end = semi + 1
                break
    text = text[:start] + demo_banners + text[end:]
else:
    text += "\\n\\n" + demo_banners + "\\n"

file.write_text(text)
print("Done. Backup created at src/data/seed.js.bak-demo")
