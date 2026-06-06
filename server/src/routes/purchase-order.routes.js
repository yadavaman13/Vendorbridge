import { Router } from "express";
import {
  createPurchaseOrderController,
  listPurchaseOrdersController,
  getPurchaseOrderByIdController,
  updatePurchaseOrderController,
  updatePOStatusController,
  sendPOController,
  acknowledgePOController,
  listVendorPOsController,
} from "../controllers/purchase-order.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Create PO
router.post("/purchase-orders", authUser, createPurchaseOrderController);

// List POs (Filtered/Paginated)
router.get("/purchase-orders", authUser, listPurchaseOrdersController);

// Get Vendor's own POs (Must be registered before /:id parameter matching)
router.get("/vendors/me/purchase-orders", authUser, listVendorPOsController);

// Get PO Details
router.get("/purchase-orders/:id", authUser, getPurchaseOrderByIdController);

// Update PO notes or delivery date
router.patch("/purchase-orders/:id", authUser, updatePurchaseOrderController);

// Update status
router.patch("/purchase-orders/:id/status", authUser, updatePOStatusController);

// Send PO to vendor
router.post("/purchase-orders/:id/send", authUser, sendPOController);

// Acknowledge PO
router.post("/purchase-orders/:id/acknowledge", authUser, acknowledgePOController);

export default router;
