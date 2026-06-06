import { Router } from "express";
import {
  getActivityLogsController,
  getEntityTimelineController,
  getDashboardSummaryController,
  getProcurementReportController,
  getVendorPerformanceReportController,
} from "../controllers/activity-log.controller.js";
import {
  authUser,
  isAdmin,
  isOfficerOrAdmin,
  allowRoles,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Activity Log Stream (Admin only)
router.get("/activity-logs", authUser, isAdmin, getActivityLogsController);

// Entity Timeline (Admin or Procurement Officer or Manager)
router.get(
  "/activity-logs/:entityType/:entityId",
  authUser,
  allowRoles("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"),
  getEntityTimelineController
);

// Dashboard Summary (Any authenticated user)
router.get("/dashboard/summary", authUser, getDashboardSummaryController);

// Procurement Reports (Admin or Procurement Officer or Manager)
router.get(
  "/reports/procurement",
  authUser,
  allowRoles("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"),
  getProcurementReportController
);

// Vendor Performance Reports (Admin or Procurement Officer or Manager)
router.get(
  "/reports/vendor-performance",
  authUser,
  allowRoles("ADMIN", "PROCUREMENT_OFFICER", "MANAGER"),
  getVendorPerformanceReportController
);

export default router;
