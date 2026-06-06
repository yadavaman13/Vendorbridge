import { Router } from "express";
import {
  createInvoiceController,
  listInvoicesController,
  getInvoiceByIdController,
  updateInvoiceController,
  updateInvoiceStatusController,
  sendInvoiceController,
  emailInvoiceController,
  downloadInvoicePdfController,
  downloadInvoicePdfFileController,
  printInvoiceController,
} from "../controllers/invoice.controller.js";
import { authUser, isVendor } from "../middlewares/auth.middleware.js";

const router = Router();

// Create Invoice (Vendors and staff)
router.post("/", authUser, createInvoiceController);

// List Invoices (Authenticated users, role-restricted inside controller)
router.get("/", authUser, listInvoicesController);

// Get Invoice details
router.get("/:id", authUser, getInvoiceByIdController);

// Update Invoice editable fields
router.patch("/:id", authUser, updateInvoiceController);

// Update Invoice status
router.patch("/:id/status", authUser, updateInvoiceStatusController);

// Mark Invoice as sent (Vendors only)
router.post("/:id/send", authUser, isVendor, sendInvoiceController);

// Email Invoice
router.post("/:id/email", authUser, emailInvoiceController);

// Download Invoice PDF metadata
router.get("/:id/download", authUser, downloadInvoicePdfController);

// Download physical PDF file
router.get("/:id/download/file", authUser, downloadInvoicePdfFileController);

// Print Invoice representation
router.get("/:id/print", authUser, printInvoiceController);

export default router;
