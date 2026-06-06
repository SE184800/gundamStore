import express from "express";
import {
  createAdminCustomerNote,
  getAdminCustomerDetail,
  listAdminCustomers,
  updateAdminCustomerProfile,
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/admin", listAdminCustomers);
router.get("/admin/:key", getAdminCustomerDetail);
router.post("/admin/notes", createAdminCustomerNote);
router.patch("/admin/:id/profile", updateAdminCustomerProfile);

export default router;
