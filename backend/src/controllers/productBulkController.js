import { prisma } from "../config/prisma.js";

const PRODUCT_IMPORT_COLUMNS = [
  "sku",
  "slug",
  "nameVi",
  "nameEn",
  "categoryCode",
  "supplierCode",
  "brand",
  "grade",
  "scale",
  "status",
  "active",
  "price",
  "oldPrice",
  "stock",
  "imageUrl",
  "galleryUrls",
  "descriptionVi",
  "descriptionEn",
  "variantSku",
  "variantNameVi",
  "variantNameEn",
  "variantOption1Name",
  "variantOption1Value",
  "variantOption2Name",
  "variantOption2Value",
  "variantPrice",
  "variantStock",
];

function normalizeKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function makeSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function intValue(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/[,\s]/g, ""));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function parseBool(value, fallback = true) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (["true", "1", "yes", "y", "active", "publish", "published"].includes(raw)) return true;
  if (["false", "0", "no", "n", "inactive", "draft", "hidden"].includes(raw)) return false;
  return fallback;
}

function canSellWithoutStock(status = "") {
  const raw = normalizeKey(status);
  return raw.includes("pre") || raw.includes("coming");
}

function splitUrls(value = "") {
  return String(value || "")
    .split(/[|;\n]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function csvEscape(value = "") {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function toCsv(rows = []) {
  return rows
    .map((row) => PRODUCT_IMPORT_COLUMNS.map((column) => csvEscape(row[column] ?? "")).join(","))
    .join("\n");
}

function parseCsvLine(line = "") {
  const out = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      out.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current);
  return out.map((item) => item.trim());
}

function parseCsv(text = "") {
  const lines = String(text || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]).map((item) => item.trim());
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] ?? "";
    });

    row.__line = index + 2;
    return row;
  });
}

function buildTemplateCsv() {
  const sample = {
    sku: "ACTION-BASE-5",
    slug: "action-base-5",
    nameVi: "Action Base 5",
    nameEn: "Action Base 5",
    categoryCode: "ACCESSORY",
    supplierCode: "BANDAI",
    brand: "Bandai",
    grade: "Accessory",
    scale: "1/144",
    status: "inStock",
    active: "true",
    price: "180000",
    oldPrice: "0",
    stock: "10",
    imageUrl: "/images/products/action-base-5.jpg",
    galleryUrls: "/images/products/action-base-5.jpg|/images/products/action-base-5-box.jpg",
    descriptionVi: "Đế trưng bày mô hình.",
    descriptionEn: "Model kit display base.",
    variantSku: "ACTION-BASE-5-CLEAR",
    variantNameVi: "Clear",
    variantNameEn: "Clear",
    variantOption1Name: "Color",
    variantOption1Value: "Clear",
    variantOption2Name: "",
    variantOption2Value: "",
    variantPrice: "180000",
    variantStock: "5",
  };

  return `${PRODUCT_IMPORT_COLUMNS.join(",")}\n${toCsv([sample])}\n`;
}

async function getLookups() {
  const [categories, suppliers] = await Promise.all([
    prisma.productCategory.findMany({ where: { active: true } }),
    prisma.supplier.findMany({ where: { active: true } }),
  ]);

  return {
    categoryByCode: new Map(categories.map((item) => [normalizeKey(item.code), item])),
    supplierByCode: new Map(suppliers.map((item) => [normalizeKey(item.code), item])),
  };
}

function rowToProductPayload(row = {}, lookups) {
  const category = row.categoryCode ? lookups.categoryByCode.get(normalizeKey(row.categoryCode)) : null;
  const supplier = row.supplierCode ? lookups.supplierByCode.get(normalizeKey(row.supplierCode)) : null;
  const active = parseBool(row.active, true);
  const status = String(row.status || (active ? "inStock" : "draft")).trim() || "inStock";
  const imageUrl = String(row.imageUrl || "").trim();
  const gallery = splitUrls(row.galleryUrls);
  const images = Array.from(new Set([imageUrl, ...gallery].filter(Boolean)));
  const nameVi = String(row.nameVi || "").trim();
  const slug = makeSlug(row.slug || nameVi || row.sku || "");

  return {
    sku: String(row.sku || "").trim().toUpperCase(),
    slug,
    barcode: null,
    nameVi,
    nameEn: String(row.nameEn || nameVi).trim(),
    shortVi: null,
    shortEn: null,
    description: String(row.descriptionVi || "").trim() || null,
    descriptionEn: String(row.descriptionEn || "").trim() || null,
    price: intValue(row.price, 0),
    oldPrice: intValue(row.oldPrice, 0),
    stock: intValue(row.stock, 0),
    status,
    active,
    imageUrl: imageUrl || null,
    brand: String(row.brand || "").trim() || null,
    grade: String(row.grade || "").trim() || null,
    scale: String(row.scale || "").trim() || null,
    tone: null,
    sold: 0,
    rating: 0,
    specs: [],
    boxItems: [],
    media: {
      card: imageUrl || "",
      home: imageUrl || "",
      detailMain: imageUrl || "",
      gallery: images,
      hover: imageUrl || "",
      box: imageUrl || "",
    },
    categoryId: category?.id || null,
    supplierId: supplier?.id || null,
    __images: images,
    __categoryFound: Boolean(category),
    __supplierFound: Boolean(supplier),
  };
}

function rowToVariantPayload(row = {}) {
  const variantSku = String(row.variantSku || "").trim().toUpperCase();
  if (!variantSku) return null;

  return {
    sku: variantSku,
    barcode: null,
    nameVi: String(row.variantNameVi || row.variantOption1Value || variantSku).trim(),
    nameEn: String(row.variantNameEn || row.variantNameVi || row.variantOption1Value || variantSku).trim(),
    option1Name: String(row.variantOption1Name || "").trim() || null,
    option1Value: String(row.variantOption1Value || "").trim() || null,
    option2Name: String(row.variantOption2Name || "").trim() || null,
    option2Value: String(row.variantOption2Value || "").trim() || null,
    price: intValue(row.variantPrice, 0),
    oldPrice: 0,
    stock: intValue(row.variantStock, 0),
    imageUrl: String(row.imageUrl || "").trim() || null,
    active: true,
    status: "inStock",
    sortOrder: 0,
  };
}

function getDataIssues(payload = {}, row = {}) {
  const issues = [];

  if (!payload.sku) issues.push("Missing SKU");
  if (!payload.nameVi) issues.push("Missing product name");
  if (payload.active && !payload.categoryId) issues.push("Missing category");
  const hasVariantRow = Boolean(String(row.variantSku || "").trim());

  if (payload.active && Number(payload.price || 0) <= 0 && !hasVariantRow) issues.push("Missing price");
  if (payload.active && !payload.imageUrl) issues.push("Missing image");
  if (payload.active && Number(payload.stock || 0) <= 0 && !canSellWithoutStock(payload.status) && !hasVariantRow) {
    issues.push("Missing stock");
  }

  if (row.categoryCode && !payload.__categoryFound) {
    issues.push(`Category code not found: ${row.categoryCode}`);
  }

  if (row.supplierCode && !payload.__supplierFound) {
    issues.push(`Supplier code not found: ${row.supplierCode}`);
  }

  const variant = rowToVariantPayload(row);
  if (variant) {
    if (!variant.sku) issues.push("Missing variant SKU");
    if (Number(variant.price || 0) <= 0) issues.push(`Variant ${variant.sku} missing price`);
    if (Number(variant.stock || 0) <= 0) issues.push(`Variant ${variant.sku} missing stock`);
  }

  return issues;
}

function buildPreviewRows(rows = [], lookups) {
  return rows.map((row) => {
    const payload = rowToProductPayload(row, lookups);
    const issues = getDataIssues(payload, row);
    const variant = rowToVariantPayload(row);

    return {
      line: row.__line,
      sku: payload.sku,
      slug: payload.slug,
      nameVi: payload.nameVi,
      categoryCode: row.categoryCode || "",
      supplierCode: row.supplierCode || "",
      price: payload.price,
      stock: payload.stock,
      active: payload.active,
      status: payload.status,
      variantSku: variant?.sku || "",
      variantPrice: variant?.price || 0,
      variantStock: variant?.stock || 0,
      valid: issues.length === 0,
      errors: issues,
    };
  });
}

function groupRowsBySku(rows = []) {
  const grouped = new Map();

  for (const row of rows) {
    const sku = String(row.sku || "").trim().toUpperCase();
    if (!sku) continue;

    if (!grouped.has(sku)) grouped.set(sku, []);
    grouped.get(sku).push(row);
  }

  return grouped;
}

async function syncImages(tx, productId, payload) {
  await tx.productImage.deleteMany({ where: { productId } });

  const images = payload.__images || [];
  if (!images.length) return;

  await tx.productImage.createMany({
    data: images.map((url, index) => ({
      productId,
      url,
      alt: payload.nameVi,
      type: index === 0 ? "primary" : "gallery",
      sortOrder: index,
      active: true,
    })),
  });
}

async function syncPriceHistory(tx, product, nextPrice, oldPrice = 0) {
  if (Number(nextPrice || 0) <= 0) return;

  if (!product || Number(product.price || 0) !== Number(nextPrice || 0) || Number(product.oldPrice || 0) !== Number(oldPrice || 0)) {
    await tx.productPrice.create({
      data: {
        productId: product.id,
        price: Number(nextPrice || 0),
        oldPrice: Number(oldPrice || 0),
        source: "BULK_IMPORT",
        suggestedPrice: Number(nextPrice || 0),
        marginPercent: 0,
        baseCost: 0,
        startDate: new Date(),
        active: true,
        note: "Created by bulk product import",
      },
    });
  }
}

async function syncStockLog(tx, product, nextStock) {
  if (!product || Number(product.stock || 0) === Number(nextStock || 0)) return;

  await tx.inventoryLog.create({
    data: {
      productId: product.id,
      type: Number(nextStock || 0) >= Number(product.stock || 0) ? "IMPORT" : "ADJUST",
      quantity: Math.abs(Number(nextStock || 0) - Number(product.stock || 0)),
      beforeStock: Number(product.stock || 0),
      afterStock: Number(nextStock || 0),
      reason: "Bulk product import stock sync",
      refType: "PRODUCT_BULK_IMPORT",
      refId: product.id,
    },
  });
}

async function upsertVariant(tx, productId, variantPayload) {
  if (!variantPayload) return null;

  const existing = await tx.productVariant.findUnique({
    where: { sku: variantPayload.sku },
  });

  if (existing && existing.productId !== productId) {
    const error = new Error(`Variant SKU ${variantPayload.sku} already belongs to another product.`);
    error.status = 409;
    throw error;
  }

  if (existing) {
    return tx.productVariant.update({
      where: { id: existing.id },
      data: variantPayload,
    });
  }

  return tx.productVariant.create({
    data: {
      ...variantPayload,
      productId,
    },
  });
}

function cleanProductPayload(payload) {
  const { __images, __categoryFound, __supplierFound, ...clean } = payload;
  return clean;
}

export async function downloadAdminProductImportTemplateCsv(req, res, next) {
  try {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="product-import-template.csv"');
    res.send(buildTemplateCsv());
  } catch (error) {
    next(error);
  }
}

export async function exportAdminProductsCsv(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        images: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
        variants: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    const rows = [];

    for (const product of products) {
      const base = {
        sku: product.sku,
        slug: product.slug,
        nameVi: product.nameVi,
        nameEn: product.nameEn || "",
        categoryCode: product.category?.code || "",
        supplierCode: product.supplier?.code || "",
        brand: product.brand || "",
        grade: product.grade || "",
        scale: product.scale || "",
        status: product.status || "",
        active: product.active ? "true" : "false",
        price: product.price || 0,
        oldPrice: product.oldPrice || 0,
        stock: product.stock || 0,
        imageUrl: product.imageUrl || "",
        galleryUrls: (product.images || []).map((image) => image.url).filter(Boolean).join("|"),
        descriptionVi: product.description || "",
        descriptionEn: product.descriptionEn || "",
      };

      if (product.variants?.length) {
        for (const variant of product.variants) {
          rows.push({
            ...base,
            variantSku: variant.sku,
            variantNameVi: variant.nameVi,
            variantNameEn: variant.nameEn || "",
            variantOption1Name: variant.option1Name || "",
            variantOption1Value: variant.option1Value || "",
            variantOption2Name: variant.option2Name || "",
            variantOption2Value: variant.option2Value || "",
            variantPrice: variant.price || 0,
            variantStock: variant.stock || 0,
          });
        }
      } else {
        rows.push({
          ...base,
          variantSku: "",
          variantNameVi: "",
          variantNameEn: "",
          variantOption1Name: "",
          variantOption1Value: "",
          variantOption2Name: "",
          variantOption2Value: "",
          variantPrice: "",
          variantStock: "",
        });
      }
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="products-export.csv"');
    res.send(`${PRODUCT_IMPORT_COLUMNS.join(",")}\n${toCsv(rows)}\n`);
  } catch (error) {
    next(error);
  }
}

export async function previewAdminProductImportCsv(req, res, next) {
  try {
    const csvText = String(req.body?.csvText || "");
    const rows = parseCsv(csvText);
    const lookups = await getLookups();
    const previewRows = buildPreviewRows(rows, lookups);

    res.json({
      success: true,
      totalRows: previewRows.length,
      validRows: previewRows.filter((row) => row.valid).length,
      errorRows: previewRows.filter((row) => !row.valid).length,
      rows: previewRows,
    });
  } catch (error) {
    next(error);
  }
}

export async function commitAdminProductImportCsv(req, res, next) {
  try {
    const csvText = String(req.body?.csvText || "");
    const mode = String(req.body?.mode || "upsert").toLowerCase();
    const rows = parseCsv(csvText);
    const lookups = await getLookups();
    const previewRows = buildPreviewRows(rows, lookups);
    const errorRows = previewRows.filter((row) => !row.valid);

    if (errorRows.length) {
      return res.status(400).json({
        success: false,
        message: "Import has critical validation errors. Please fix and preview again.",
        errorRows,
      });
    }

    const grouped = groupRowsBySku(rows);
    let created = 0;
    let updated = 0;
    let variants = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const [sku, productRows] of grouped.entries()) {
        const firstRow = productRows[0];
        const payload = rowToProductPayload(firstRow, lookups);
        const existing = await tx.product.findUnique({
          where: { sku },
        });

        if (mode === "create" && existing) {
          skipped += 1;
          continue;
        }

        if (mode === "update" && !existing) {
          skipped += 1;
          continue;
        }

        let product;

        if (existing) {
          await syncStockLog(tx, existing, payload.stock);
          await syncPriceHistory(tx, existing, payload.price, payload.oldPrice);

          product = await tx.product.update({
            where: { id: existing.id },
            data: cleanProductPayload(payload),
          });

          await syncImages(tx, product.id, payload);
          updated += 1;
        } else {
          product = await tx.product.create({
            data: cleanProductPayload(payload),
          });

          await syncImages(tx, product.id, payload);
          await syncPriceHistory(tx, product, payload.price, payload.oldPrice);

          if (payload.stock > 0) {
            await tx.inventoryLog.create({
              data: {
                productId: product.id,
                type: "IMPORT",
                quantity: payload.stock,
                beforeStock: 0,
                afterStock: payload.stock,
                reason: "Bulk product import initial stock",
                refType: "PRODUCT_BULK_IMPORT",
                refId: product.id,
              },
            });
          }

          created += 1;
        }

        for (const row of productRows) {
          const variantPayload = rowToVariantPayload(row);
          if (!variantPayload) continue;

          await upsertVariant(tx, product.id, variantPayload);
          variants += 1;
        }
      }
    });

    res.json({
      success: true,
      created,
      updated,
      variants,
      skipped,
      totalGroups: grouped.size,
    });
  } catch (error) {
    next(error);
  }
}
