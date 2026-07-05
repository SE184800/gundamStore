import multer from "multer";
import { prisma } from "../config/prisma.js";
import {
  assertUploadableImage,
  makeSafeSlug,
  optimizeBannerImage,
  optimizeCategoryImage,
  optimizeProductImage,
} from "../services/imageOptimizationService.js";
import { uploadMediaBuffer } from "../services/mediaStorageService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 6,
  },
});

export const uploadProductImagesMiddleware = upload.array("images", 6);
export const uploadBannerImageMiddleware = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "desktop", maxCount: 1 },
  { name: "mobile", maxCount: 1 },
]);
export const uploadCategoryImageMiddleware = upload.single("image");

function datePath(now = new Date()) {
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function uploadedFileList(req) {
  if (Array.isArray(req.files)) return req.files;
  return [];
}

function oneFile(req, fieldName = "image") {
  if (req.file) return req.file;
  if (req.files?.[fieldName]?.[0]) return req.files[fieldName][0];
  return null;
}

async function uploadOptimizedProductVariant({ product, file, imageIndex }) {
  assertUploadableImage(file);
  const optimized = await optimizeProductImage(file.buffer);
  const productSlug = makeSafeSlug(product.slug || product.nameVi || product.sku || product.id);
  const basePath = `products/${datePath()}/${productSlug}/${imageIndex}`;

  const [thumbUpload, cardUpload, detailUpload] = await Promise.all([
    uploadMediaBuffer({ path: `${basePath}/thumb.webp`, buffer: optimized.variants.thumb.buffer }),
    uploadMediaBuffer({ path: `${basePath}/card.webp`, buffer: optimized.variants.card.buffer }),
    uploadMediaBuffer({ path: `${basePath}/detail.webp`, buffer: optimized.variants.detail.buffer }),
  ]);

  return {
    optimized,
    thumbUpload,
    cardUpload,
    detailUpload,
    basePath,
  };
}

export async function uploadProductImages(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();
    const files = uploadedFileList(req);

    if (!files.length) {
      return res.status(400).json({ success: false, message: "Please upload 1 to 6 image files using field name images." });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const replace = String(req.query.replace || req.body?.replace || "false").toLowerCase() === "true";
    const startingSortOrder = replace ? 0 : product.images.length;

    const createdImages = [];

    if (replace) {
      await prisma.productImage.updateMany({
        where: { productId, active: true },
        data: { active: false, storageStatus: "INACTIVE" },
      });
    }

    for (let index = 0; index < files.length; index += 1) {
      const sortOrder = startingSortOrder + index;
      const imageIndex = sortOrder + 1;
      const result = await uploadOptimizedProductVariant({ product, file: files[index], imageIndex });
      const isPrimary = sortOrder === 0;

      const image = await prisma.productImage.create({
        data: {
          productId,
          url: result.cardUpload.url,
          thumbUrl: result.thumbUpload.url,
          cardUrl: result.cardUpload.url,
          detailUrl: result.detailUpload.url,
          originalUrl: null,
          bucket: result.cardUpload.bucket,
          storagePath: result.basePath,
          mimeType: "image/webp",
          width: result.optimized.variants.detail.width,
          height: result.optimized.variants.detail.height,
          sizeBytes: result.optimized.variants.card.sizeBytes,
          storageProvider: "SUPABASE",
          storageStatus: "ACTIVE",
          isPrimary,
          alt: product.nameVi,
          type: isPrimary ? "primary" : "gallery",
          sortOrder,
          active: true,
        },
      });

      createdImages.push(image);
    }

    const primary = createdImages.find((image) => image.isPrimary) || createdImages[0];
    if (primary?.cardUrl) {
      await prisma.product.update({
        where: { id: productId },
        data: { imageUrl: primary.cardUrl },
      });
    }

    return res.status(201).json({
      success: true,
      productId,
      images: createdImages,
    });
  } catch (error) {
    next(error);
  }
}

async function uploadBannerVariant(file, banner, variantName) {
  assertUploadableImage(file);
  const optimized = await optimizeBannerImage(file.buffer);
  const bannerSlug = makeSafeSlug(banner.titleInternal || banner.altText || banner.id);
  const basePath = `banners/${datePath()}/${bannerSlug}`;

  const desktopSource = variantName === "mobile" ? optimized.variants.mobile : optimized.variants.desktop;
  const mobileSource = variantName === "desktop" ? optimized.variants.desktop : optimized.variants.mobile;

  const [desktopUpload, mobileUpload, tabletUpload] = await Promise.all([
    uploadMediaBuffer({ path: `${basePath}/desktop.webp`, buffer: desktopSource.buffer }),
    uploadMediaBuffer({ path: `${basePath}/mobile.webp`, buffer: mobileSource.buffer }),
    uploadMediaBuffer({ path: `${basePath}/tablet.webp`, buffer: optimized.variants.tablet.buffer }),
  ]);

  return {
    desktopUpload,
    mobileUpload,
    tabletUpload,
    optimized,
  };
}

export async function uploadBannerImages(req, res, next) {
  try {
    const bannerId = String(req.params.bannerId || "").trim();
    const banner = await prisma.banner.findUnique({ where: { id: bannerId } });

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found." });
    }

    const desktopFile = oneFile(req, "desktop") || oneFile(req, "image");
    const mobileFile = oneFile(req, "mobile") || oneFile(req, "image");

    if (!desktopFile && !mobileFile) {
      return res.status(400).json({ success: false, message: "Upload image, desktop, or mobile file." });
    }

    const desktopResult = desktopFile ? await uploadBannerVariant(desktopFile, banner, "desktop") : null;
    const mobileResult = mobileFile && mobileFile !== desktopFile ? await uploadBannerVariant(mobileFile, banner, "mobile") : desktopResult;

    const desktopUrl = desktopResult?.desktopUpload?.url || banner.desktopImage || banner.mainImage;
    const mobileUrl = mobileResult?.mobileUpload?.url || banner.mobileImage || desktopUrl;
    const tabletUrl = desktopResult?.tabletUpload?.url || banner.tabletImage || desktopUrl;

    const updated = await prisma.banner.update({
      where: { id: bannerId },
      data: {
        mainImage: desktopUrl,
        imageUrl: desktopUrl,
        desktopImage: desktopUrl,
        mobileImage: mobileUrl,
        tabletImage: tabletUrl,
        mediaType: "image",
        fitMode: banner.fitMode || "cover",
      },
    });

    return res.status(201).json({
      success: true,
      banner: updated,
      urls: {
        desktopUrl,
        mobileUrl,
        tabletUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function uploadCategoryImage(req, res, next) {
  try {
    const categoryId = String(req.params.categoryId || "").trim();
    const file = oneFile(req, "image");

    if (!file) {
      return res.status(400).json({ success: false, message: "Upload category image using field name image." });
    }

    assertUploadableImage(file);

    const category = await prisma.productCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found." });
    }

    const optimized = await optimizeCategoryImage(file.buffer);
    const categorySlug = makeSafeSlug(category.slug || category.code || category.nameVi || category.id);
    const uploadResult = await uploadMediaBuffer({
      path: `categories/${categorySlug}.webp`,
      buffer: optimized.variants.card.buffer,
    });

    const updated = await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        imageUrl: uploadResult.url,
        icon: uploadResult.url,
      },
    });

    return res.status(201).json({
      success: true,
      category: updated,
      url: uploadResult.url,
    });
  } catch (error) {
    next(error);
  }
}
