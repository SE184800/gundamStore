import { prisma } from "../config/prisma.js";

function makeSlug(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ν]/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "category-group";
}

function makeCode(value = "") {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "CATEGORY_GROUP";
}

function intValue(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

function cuidLike(prefix = "catgrp") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function sanitizeGroupInput(body = {}) {
  const nameVi = String(body.nameVi || body.name?.vi || body.name || "").trim();
  const nameEn = String(body.nameEn || body.name?.en || nameVi).trim();
  const code = makeCode(body.code || body.slug || nameVi);
  const slug = makeSlug(body.slug || nameVi || code);

  if (!nameVi || !code || !slug) {
    const error = new Error("Category group code, slug and Vietnamese name are required.");
    error.status = 400;
    throw error;
  }

  return {
    code,
    slug,
    nameVi,
    nameEn,
    description: String(body.description || "").trim() || null,
    imageUrl: String(body.imageUrl || body.icon || "").trim() || null,
    icon: String(body.icon || body.imageUrl || "").trim() || null,
    active: body.active !== false,
    sortOrder: intValue(body.sortOrder, 0),
  };
}

function normalizeRow(row = {}) {
  return {
    ...row,
    productCount: Number(row.productCount || 0),
    categoryCount: Number(row.categoryCount || 0),
    sortOrder: Number(row.sortOrder || 0),
    active: row.active !== false,
  };
}

async function getCategoryGroupsRaw({ activeOnly = false } = {}) {
  const activeFilter = activeOnly ? prisma.$queryRaw`
    WHERE g."active" = true
  ` : prisma.$queryRaw``;

  // Prisma does not support interpolating SQL fragments in the middle reliably across versions here,
  // so keep the two branches explicit.
  if (activeOnly) {
    return prisma.$queryRaw`
      SELECT
        g."id", g."code", g."slug", g."nameVi", g."nameEn", g."description", g."imageUrl", g."icon",
        g."active", g."sortOrder", g."createdAt", g."updatedAt",
        COALESCE(COUNT(DISTINCT c."id"), 0)::int AS "categoryCount",
        COALESCE(COUNT(DISTINCT p."id"), 0)::int AS "productCount"
      FROM "ProductCategoryGroup" g
      LEFT JOIN "ProductCategory" c ON c."categoryGroupId" = g."id" AND c."active" = true
      LEFT JOIN "Product" p ON p."categoryId" = c."id" AND p."active" = true
      WHERE g."active" = true
      GROUP BY g."id"
      ORDER BY g."sortOrder" ASC, g."nameVi" ASC
    `;
  }

  return prisma.$queryRaw`
    SELECT
      g."id", g."code", g."slug", g."nameVi", g."nameEn", g."description", g."imageUrl", g."icon",
      g."active", g."sortOrder", g."createdAt", g."updatedAt",
      COALESCE(COUNT(DISTINCT c."id"), 0)::int AS "categoryCount",
      COALESCE(COUNT(DISTINCT p."id"), 0)::int AS "productCount"
    FROM "ProductCategoryGroup" g
    LEFT JOIN "ProductCategory" c ON c."categoryGroupId" = g."id" AND c."active" = true
    LEFT JOIN "Product" p ON p."categoryId" = c."id" AND p."active" = true
    GROUP BY g."id"
    ORDER BY g."sortOrder" ASC, g."nameVi" ASC
  `;
}

async function getCategoriesWithCountsRaw({ activeOnly = false } = {}) {
  if (activeOnly) {
    return prisma.$queryRaw`
      SELECT
        c."id", c."code", c."slug", c."nameVi", c."nameEn", c."description", c."imageUrl", c."icon", c."altText",
        c."active", c."sortOrder", c."categoryGroupId", c."createdAt", c."updatedAt",
        COALESCE(COUNT(DISTINCT p."id"), 0)::int AS "productCount",
        CASE WHEN g."id" IS NULL THEN NULL ELSE json_build_object(
          'id', g."id",
          'code', g."code",
          'slug', g."slug",
          'nameVi', g."nameVi",
          'nameEn', g."nameEn",
          'imageUrl', g."imageUrl",
          'icon', g."icon",
          'sortOrder', g."sortOrder",
          'active', g."active"
        ) END AS "categoryGroup"
      FROM "ProductCategory" c
      LEFT JOIN "ProductCategoryGroup" g ON g."id" = c."categoryGroupId"
      LEFT JOIN "Product" p ON p."categoryId" = c."id" AND p."active" = true
      WHERE c."active" = true
      GROUP BY c."id", g."id"
      ORDER BY COALESCE(g."sortOrder", 9999) ASC, c."sortOrder" ASC, c."nameVi" ASC
    `;
  }

  return prisma.$queryRaw`
    SELECT
      c."id", c."code", c."slug", c."nameVi", c."nameEn", c."description", c."imageUrl", c."icon", c."altText",
      c."active", c."sortOrder", c."categoryGroupId", c."createdAt", c."updatedAt",
      COALESCE(COUNT(DISTINCT p."id"), 0)::int AS "productCount",
      CASE WHEN g."id" IS NULL THEN NULL ELSE json_build_object(
        'id', g."id",
        'code', g."code",
        'slug', g."slug",
        'nameVi', g."nameVi",
        'nameEn', g."nameEn",
        'imageUrl', g."imageUrl",
        'icon', g."icon",
        'sortOrder', g."sortOrder",
        'active', g."active"
      ) END AS "categoryGroup"
    FROM "ProductCategory" c
    LEFT JOIN "ProductCategoryGroup" g ON g."id" = c."categoryGroupId"
    LEFT JOIN "Product" p ON p."categoryId" = c."id" AND p."active" = true
    GROUP BY c."id", g."id"
    ORDER BY COALESCE(g."sortOrder", 9999) ASC, c."sortOrder" ASC, c."nameVi" ASC
  `;
}

function buildTree(groups = [], categories = []) {
  const byGroup = new Map();

  for (const group of groups.map(normalizeRow)) {
    byGroup.set(group.id, { ...group, count: group.productCount, children: [] });
  }

  const ungrouped = {
    id: "ungrouped",
    code: "UNGROUPED",
    slug: "ungrouped",
    nameVi: "Danh mục khác",
    nameEn: "Other categories",
    active: true,
    sortOrder: 9999,
    productCount: 0,
    categoryCount: 0,
    count: 0,
    children: [],
  };

  for (const category of categories.map(normalizeRow)) {
    const child = { ...category, count: category.productCount };
    const groupId = category.categoryGroupId;
    const parent = groupId && byGroup.has(groupId) ? byGroup.get(groupId) : ungrouped;
    parent.children.push(child);
    if (parent.id === "ungrouped") {
      parent.productCount += child.productCount;
      parent.count += child.productCount;
      parent.categoryCount += 1;
    }
  }

  const tree = Array.from(byGroup.values());
  if (ungrouped.children.length) tree.push(ungrouped);

  return tree.map((group) => ({
    ...group,
    children: [...(group.children || [])].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.nameVi || "").localeCompare(String(b.nameVi || ""))),
  }));
}

export async function listStorefrontCategoryTree(req, res, next) {
  try {
    const [groups, categories] = await Promise.all([
      getCategoryGroupsRaw({ activeOnly: true }),
      getCategoriesWithCountsRaw({ activeOnly: true }),
    ]);

    res.json({
      success: true,
      groups: groups.map(normalizeRow),
      categories: categories.map(normalizeRow),
      tree: buildTree(groups, categories),
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminCategoryGroups(req, res, next) {
  try {
    const [groups, categories] = await Promise.all([
      getCategoryGroupsRaw({ activeOnly: false }),
      getCategoriesWithCountsRaw({ activeOnly: false }),
    ]);

    res.json({
      success: true,
      groups: groups.map(normalizeRow),
      categories: categories.map(normalizeRow),
      tree: buildTree(groups, categories),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAdminCategoryGroup(req, res, next) {
  try {
    const payload = sanitizeGroupInput(req.body);
    const id = req.body.id || cuidLike("catgrp");

    const [group] = await prisma.$queryRaw`
      INSERT INTO "ProductCategoryGroup" (
        "id", "code", "slug", "nameVi", "nameEn", "description", "imageUrl", "icon", "active", "sortOrder"
      ) VALUES (
        ${id}, ${payload.code}, ${payload.slug}, ${payload.nameVi}, ${payload.nameEn}, ${payload.description}, ${payload.imageUrl}, ${payload.icon}, ${payload.active}, ${payload.sortOrder}
      )
      RETURNING *
    `;

    res.status(201).json({ success: true, group: normalizeRow(group) });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminCategoryGroup(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();
    const payload = sanitizeGroupInput(req.body);

    const [group] = await prisma.$queryRaw`
      UPDATE "ProductCategoryGroup"
      SET
        "code" = ${payload.code},
        "slug" = ${payload.slug},
        "nameVi" = ${payload.nameVi},
        "nameEn" = ${payload.nameEn},
        "description" = ${payload.description},
        "imageUrl" = ${payload.imageUrl},
        "icon" = ${payload.icon},
        "active" = ${payload.active},
        "sortOrder" = ${payload.sortOrder},
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id}
      RETURNING *
    `;

    if (!group) return res.status(404).json({ success: false, message: "Category group not found." });
    res.json({ success: true, group: normalizeRow(group) });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminCategoryGroup(req, res, next) {
  try {
    const id = String(req.params.id || "").trim();

    const [group] = await prisma.$queryRaw`
      UPDATE "ProductCategoryGroup"
      SET "active" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${id}
      RETURNING *
    `;

    await prisma.$executeRaw`
      UPDATE "ProductCategory"
      SET "categoryGroupId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "categoryGroupId" = ${id}
    `;

    if (!group) return res.status(404).json({ success: false, message: "Category group not found." });
    res.json({ success: true, group: normalizeRow(group) });
  } catch (err) {
    next(err);
  }
}

export async function assignAdminCategoryToGroup(req, res, next) {
  try {
    const categoryId = String(req.params.id || "").trim();
    const categoryGroupId = req.body.categoryGroupId ? String(req.body.categoryGroupId).trim() : null;

    const [category] = await prisma.$queryRaw`
      UPDATE "ProductCategory"
      SET "categoryGroupId" = ${categoryGroupId}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = ${categoryId}
      RETURNING *
    `;

    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    res.json({ success: true, category: normalizeRow(category) });
  } catch (err) {
    next(err);
  }
}

export async function setAdminCategoryGroupCategories(req, res, next) {
  try {
    const groupId = String(req.params.id || "").trim();
    const categoryIds = Array.isArray(req.body.categoryIds) ? req.body.categoryIds.map(String) : [];

    const [group] = await prisma.$queryRaw`
      SELECT * FROM "ProductCategoryGroup" WHERE "id" = ${groupId} LIMIT 1
    `;

    if (!group) return res.status(404).json({ success: false, message: "Category group not found." });

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "ProductCategory"
        SET "categoryGroupId" = NULL, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "categoryGroupId" = ${groupId}
      `;

      if (categoryIds.length) {
        await tx.$executeRaw`
          UPDATE "ProductCategory"
          SET "categoryGroupId" = ${groupId}, "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ANY(${categoryIds})
        `;
      }
    });

    const categories = await getCategoriesWithCountsRaw({ activeOnly: false });
    res.json({ success: true, group: normalizeRow(group), categories: categories.map(normalizeRow) });
  } catch (err) {
    next(err);
  }
}
