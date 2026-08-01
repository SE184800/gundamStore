const COMMUNITY_GALLERY_KEY = "gundam-community-gallery";

const seedGallery = [
  {
    id: "gal-seed-1",
    title: "RG Hi-ν Gundam clean build",
    builderName: "Builder Kai",
    grade: "RG",
    series: "UC",
    productName: "RG Hi-ν Gundam",
    imageUrl: "/images/products/hi-nu.jpg",
    caption: "Clean build, panel line nhẹ, giữ màu nguyên bản.",
    status: "Approved",
    createdAt: "2026-05-01T10:00:00.000Z",
  },
  {
    id: "gal-seed-2",
    title: "MGEX Strike Freedom display",
    builderName: "Seed Fan",
    grade: "MGEX",
    series: "SEED",
    productName: "MGEX Strike Freedom",
    imageUrl: "/images/products/strike-freedom.jpg",
    caption: "Trưng bày cùng action base và ánh sáng vàng.",
    status: "Approved",
    createdAt: "2026-05-02T10:00:00.000Z",
  },
];

function sanitize(value = "", max = 255) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function readRows() {
  try {
    const raw = localStorage.getItem(COMMUNITY_GALLERY_KEY);
    if (!raw) return seedGallery;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedGallery;
  } catch {
    return seedGallery;
  }
}

function writeRows(rows) {
  localStorage.setItem(COMMUNITY_GALLERY_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
}

export function getGallerySubmissions({ includePending = false } = {}) {
  const rows = readRows();
  writeRows(rows);
  return includePending ? rows : rows.filter((row) => row.status === "Approved");
}

export function submitGalleryBuild(payload = {}) {
  const title = sanitize(payload.title, 100);
  const builderName = sanitize(payload.builderName, 80);
  const productName = sanitize(payload.productName, 100);
  const imageUrl = sanitize(payload.imageUrl, 500);
  const caption = sanitize(payload.caption, 500);

  if (!title || title.length < 3) {
    throw new Error("Vui lÃ²ng nháº­p tiÃªu Ä‘á» bÃ i Ä‘Äƒng.");
  }

  if (!builderName || builderName.length < 2) {
    throw new Error("Vui lÃ²ng nháº­p tÃªn builder.");
  }

  if (!imageUrl || !/^https?:\/\//.test(imageUrl) && !imageUrl.startsWith("/")) {
    throw new Error("Vui lÃ²ng nháº­p URL hÃ¬nh áº£nh há»£p lá»‡.");
  }

  const rows = readRows();

  const row = {
    id: `GAL-${Date.now()}`,
    title,
    builderName,
    productName,
    grade: sanitize(payload.grade, 30) || "Gunpla",
    series: sanitize(payload.series, 50) || "Community",
    imageUrl,
    caption,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };

  writeRows([row, ...rows]);
  return row;
}

export function updateGalleryStatus(id, status = "Approved") {
  const rows = readRows().map((row) =>
    row.id === id
      ? {
          ...row,
          status,
          updatedAt: new Date().toISOString(),
        }
      : row
  );

  writeRows(rows);
  return rows;
}

export function deleteGallerySubmission(id) {
  const rows = readRows().filter((row) => row.id !== id);
  writeRows(rows);
  return rows;
}

export function getGallerySummary() {
  const rows = readRows();

  return {
    total: rows.length,
    approved: rows.filter((row) => row.status === "Approved").length,
    pending: rows.filter((row) => row.status === "Pending").length,
    rejected: rows.filter((row) => row.status === "Rejected").length,
  };
}

