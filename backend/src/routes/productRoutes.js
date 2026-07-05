import express from "express";
import { listHomeProducts } from "../controllers/homeProductController.js";
import {
  adjustAdminProductInventory,
  createAdminProduct,
  createAdminProductPrice,
  deactivateAdminProductPrice,
  createAdminProductCategory,
  createAdminProductGroup,
  createAdminSupplier,
  deleteAdminProduct,
  deleteAdminProductCategory,
  deleteAdminProductGroup,
  deleteAdminSupplier,
  listAdminProductPrices,
  getAdminCatalogReference,
  listAdminInventoryLogs,
  getStorefrontProductByKey,
  listAdminProductCategories,
  listAdminProductGroups,
  listAdminProducts,
  listAdminSuppliers,
  listStorefrontProducts,
  listStorefrontProductCategories,
  setAdminProductGroups,
  updateAdminProduct,
  updateAdminProductPrice,
  updateAdminProductCategory,
  updateAdminProductGroup,
  updateAdminSupplier,
} from "../controllers/productController.js";
import {
  commitAdminProductImportCsv,
  downloadAdminProductImportTemplateCsv,
  exportAdminProductsCsv,
  previewAdminProductImportCsv,
} from "../controllers/productBulkController.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";

const router = express.Router();

const requireProductRead = [requireAuth, requirePermission("products:read")];
const requireProductUpdate = [requireAuth, requirePermission("products:update")];

router.get("/admin/reference", ...requireProductRead, getAdminCatalogReference);
router.get("/admin/import-template", ...requireProductRead, downloadAdminProductImportTemplateCsv);
router.get("/admin/export", ...requireProductRead, exportAdminProductsCsv);
router.post("/admin/import-preview", ...requireProductUpdate, previewAdminProductImportCsv);
router.post("/admin/import-commit", ...requireProductUpdate, commitAdminProductImportCsv);



router.get("/admin/prices", ...requireProductRead, listAdminProductPrices);
router.post("/admin/:id/prices", ...requireProductUpdate, createAdminProductPrice);
router.patch("/admin/prices/:priceId", ...requireProductUpdate, updateAdminProductPrice);
router.delete("/admin/prices/:priceId", ...requireProductUpdate, deactivateAdminProductPrice);

router.get("/admin/inventory-logs", ...requireProductRead, listAdminInventoryLogs);
router.post("/admin/:id/inventory-adjust", ...requireProductUpdate, adjustAdminProductInventory);

router.get("/admin/categories", ...requireProductRead, listAdminProductCategories);
router.post("/admin/categories", ...requireProductUpdate, createAdminProductCategory);
router.patch("/admin/categories/:id", ...requireProductUpdate, updateAdminProductCategory);
router.delete("/admin/categories/:id", ...requireProductUpdate, deleteAdminProductCategory);

router.get("/admin/suppliers", ...requireProductRead, listAdminSuppliers);
router.post("/admin/suppliers", ...requireProductUpdate, createAdminSupplier);
router.patch("/admin/suppliers/:id", ...requireProductUpdate, updateAdminSupplier);
router.delete("/admin/suppliers/:id", ...requireProductUpdate, deleteAdminSupplier);

router.get("/admin/groups", ...requireProductRead, listAdminProductGroups);
router.post("/admin/groups", ...requireProductUpdate, createAdminProductGroup);
router.patch("/admin/groups/:id", ...requireProductUpdate, updateAdminProductGroup);
router.delete("/admin/groups/:id", ...requireProductUpdate, deleteAdminProductGroup);

router.put("/admin/products/:productId/groups", ...requireProductUpdate, setAdminProductGroups);

router.get("/admin", ...requireProductRead, listAdminProducts);
router.post("/admin", ...requireProductUpdate, createAdminProduct);
router.patch("/admin/:id", ...requireProductUpdate, updateAdminProduct);
router.delete("/admin/:id", ...requireProductUpdate, deleteAdminProduct);

router.get("/categories", listStorefrontProductCategories);
router.get("/home", listHomeProducts);
router.get("/", listStorefrontProducts);
router.get("/:key", getStorefrontProductByKey);

export default router;
