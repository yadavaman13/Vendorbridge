import { Router } from "express";
import {
  createApprovalController,
  listApprovalsController,
  getApprovalByIdController,
  approveApprovalController,
  rejectApprovalController,
  getQuotationApprovalsController,
} from "../controllers/approval.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

// Create Approval request
router.post("/approvals", authUser, createApprovalController);

// List Approvals
router.get("/approvals", authUser, listApprovalsController);

// Get Approval request details
router.get("/approvals/:id", authUser, getApprovalByIdController);

// Approve request
router.patch("/approvals/:id/approve", authUser, approveApprovalController);

// Reject request
router.patch("/approvals/:id/reject", authUser, rejectApprovalController);

// Quotation approvals history subpath
router.get("/quotations/:quotationId/approvals", authUser, getQuotationApprovalsController);

export default router;
