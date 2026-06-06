import { Router } from "express";
import {
  listQuotationsController,
  getQuotationByIdController,
  selectQuotationController,
  rejectQuotationController,
} from "../controllers/quotation.controller.js";
import { authUser } from "../middlewares/auth.middleware.js";

const router = Router();

// List quotations
router.get("/", authUser, listQuotationsController);

// Detail quotation
router.get("/:id", authUser, getQuotationByIdController);

// Select (approve) quotation
router.patch("/:id/select", authUser, selectQuotationController);

// Reject quotation
router.patch("/:id/reject", authUser, rejectQuotationController);

export default router;
