import {
  listActivityLogs,
  getEntityTimeline,
  getDashboardSummary,
  getProcurementReport,
  getVendorPerformanceReport,
} from "../db/query/activity-log.query.js";
import { sendResponse } from "../utils/response.utlis.js";

/**
 * @route GET /api/activity-logs
 * @description List activity logs (Admin only)
 * @access Private (ADMIN)
 */
async function getActivityLogsController(req, res) {
  try {
    // Role protection is also managed at route middleware level, but double check here
    if (req.user?.role !== "ADMIN") {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Admins only.",
      });
    }

    const { userId, actionType, entityType, entityId, page, limit } = req.query || {};

    const filters = {};
    if (userId) filters.userId = Number(userId);
    if (actionType) filters.actionType = String(actionType);
    if (entityType) filters.entityType = String(entityType);
    if (entityId) filters.entityId = Number(entityId);

    const { items, total } = await listActivityLogs({
      filters,
      page: Number(page) || 1,
      limit: Number(limit) || 25,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Activity logs retrieved successfully.",
      data: {
        items,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 25,
      },
    });
  } catch (error) {
    console.error("Error retrieving activity logs:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve activity logs.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/activity-logs/:entityType/:entityId
 * @description Inspect timeline for a specific entity record (Admin, Manager, or Procurement Officer)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function getEntityTimelineController(req, res) {
  try {
    const { entityType, entityId } = req.params || {};

    if (!entityType || !entityId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Entity type and entity ID are required.",
      });
    }

    const timeline = await getEntityTimeline(entityType, Number(entityId));

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: `Timeline for ${entityType} ID ${entityId} retrieved successfully.`,
      data: {
        record: timeline,
      },
    });
  } catch (error) {
    console.error("Error retrieving entity timeline:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve entity timeline.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/dashboard/summary
 * @description Get role-aware dashboard summary metrics
 * @access Private (All authenticated users)
 */
async function getDashboardSummaryController(req, res) {
  try {
    const userId = req.user?.id;
    const email = req.user?.email;

    if (!userId || !email) {
      return sendResponse({
        res,
        statusCode: 401,
        success: false,
        message: "Unauthorized. Missing user identity context.",
      });
    }

    const { getUserByEmail } = await import("../services/user.service.js");
    const user = await getUserByEmail(email);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "User not found.",
      });
    }

    const summary = await getDashboardSummary(user.role, user.id);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Dashboard summary retrieved successfully.",
      data: {
        record: summary,
      },
    });
  } catch (error) {
    console.error("Error retrieving dashboard summary:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve dashboard summary.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/reports/procurement
 * @description Get procurement reporting spends and PO breakdowns (Admin, Manager, Procurement Officer)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function getProcurementReportController(req, res) {
  try {
    const report = await getProcurementReport();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Procurement report retrieved successfully.",
      data: {
        record: report,
      },
    });
  } catch (error) {
    console.error("Error retrieving procurement report:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve procurement report.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/reports/vendor-performance
 * @description Get vendor performance reporting win rates and compliance (Admin, Manager, Procurement Officer)
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function getVendorPerformanceReportController(req, res) {
  try {
    const report = await getVendorPerformanceReport();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Vendor performance report retrieved successfully.",
      data: {
        items: report,
        total: report.length,
      },
    });
  } catch (error) {
    console.error("Error retrieving vendor performance report:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve vendor performance report.",
      error: error.message,
    });
  }
}

export {
  getActivityLogsController,
  getEntityTimelineController,
  getDashboardSummaryController,
  getProcurementReportController,
  getVendorPerformanceReportController,
};
