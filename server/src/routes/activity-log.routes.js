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
} from "../middlewares/auth.middleware.js";

const router = Router();

// Activity Log Stream (Admin only)
router.get("/activity-logs", authUser, isAdmin, getActivityLogsController);

// Entity Timeline (Admin or Procurement Officer or Manager)
router.get(
  "/activity-logs/:entityType/:entityId",
  authUser,
  isOfficerOrAdmin,
  getEntityTimelineController
);

// Dashboard Summary (Any authenticated user)
router.get("/dashboard/summary", authUser, getDashboardSummaryController);

// Procurement Reports (Admin or Procurement Officer or Manager)
router.get(
  "/reports/procurement",
  authUser,
  isOfficerOrAdmin,
  getProcurementReportController
);

// Vendor Performance Reports (Admin or Procurement Officer or Manager)
router.get(
  "/reports/vendor-performance",
  authUser,
  isOfficerOrAdmin,
  getVendorPerformanceReportController
);

export default router;
