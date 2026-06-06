import { Router } from "express";
import {
  getVendorsController,
  getVendorByIdController,
  patchVendorStatusController,
  getVendorMeController,
} from "../controllers/vendors.controller.js";
import {
  authUser,
  isAdmin,
  isOfficerOrAdmin,
  isVendor,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Get paginated list of vendors (Admins and Procurement Officers only)
router.get("/", authUser, isOfficerOrAdmin, getVendorsController);

// Get own profile (Vendors only)
router.get("/me", authUser, isVendor, getVendorMeController);

// Get single vendor by ID (Admins and Procurement Officers only)
router.get("/:id", authUser, isOfficerOrAdmin, getVendorByIdController);

// Approve or reject vendor status (Admins only)
router.patch("/:id/status", authUser, isAdmin, patchVendorStatusController);

export default router;
