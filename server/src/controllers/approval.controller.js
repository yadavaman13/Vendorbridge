import {
  listApprovals,
  getApprovalById,
  createApproval,
  updateApprovalStatus,
  getQuotationApprovals,
} from "../db/query/approval.query.js";
import { sendResponse } from "../utils/response.utlis.js";

/**
 * Helper to fetch complete user context with role
 */
async function getUserWithRole(req) {
  if (!req.user?.email) return null;
  const { getUserByEmail } = await import("../services/user.service.js");
  return await getUserByEmail(req.user.email);
}

/**
 * @route POST /api/approvals
 * @description Submit a quotation approval request (Procurement Officers or Admins)
 * @access Private (ADMIN, PROCUREMENT_OFFICER, MANAGER)
 */
async function createApprovalController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "PROCUREMENT_OFFICER" && user.role !== "MANAGER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Only procurement officers, managers, or admins can submit approval requests.",
      });
    }

    const { quotationId, approverId, remarks } = req.body || {};

    if (!quotationId || !approverId) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: "Quotation ID and Approver ID are required.",
      });
    }

    const created = await createApproval({
      quotationId: Number(quotationId),
      approverId: Number(approverId),
      remarks: remarks || null,
      status: "PENDING",
    });

    return sendResponse({
      res,
      statusCode: 201,
      success: true,
      message: "Quotation approval request submitted successfully.",
      data: {
        record: created,
      },
    });
  } catch (error) {
    console.error("Error creating approval request:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to submit approval request.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/approvals
 * @description List approval requests (Admin and Managers only)
 * @access Private (ADMIN, MANAGER)
 */
async function listApprovalsController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Admins or Managers only.",
      });
    }

    const { status, approverId, quotationId, page, limit } = req.query || {};

    const filters = {};
    if (status) filters.status = String(status);
    if (approverId) filters.approverId = Number(approverId);
    if (quotationId) filters.quotationId = Number(quotationId);

    const { items, total } = await listApprovals({
      filters,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Approvals retrieved successfully.",
      data: {
        items,
        total,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
      },
    });
  } catch (error) {
    console.error("Error listing approvals:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve approvals.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/approvals/:id
 * @description View details of an approval request (Admin and Managers only)
 * @access Private (ADMIN, MANAGER)
 */
async function getApprovalByIdController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Admins or Managers only.",
      });
    }

    const { id } = req.params;
    const approval = await getApprovalById(id);

    if (!approval) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Approval request not found.",
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Approval request details retrieved successfully.",
      data: {
        record: approval,
      },
    });
  } catch (error) {
    console.error("Error retrieving approval details:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve approval details.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/approvals/:id/approve
 * @description Approve a quotation (Managers only)
 * @access Private (MANAGER, ADMIN)
 */
async function approveApprovalController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Managers or Admins only.",
      });
    }

    const { id } = req.params;
    const { remarks } = req.body || {};

    const approval = await getApprovalById(id);
    if (!approval) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Approval request not found.",
      });
    }

    const updated = await updateApprovalStatus(id, {
      status: "APPROVED",
      remarks: remarks || null,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation approved successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to approve quotation.",
      error: error.message,
    });
  }
}

/**
 * @route PATCH /api/approvals/:id/reject
 * @description Reject a quotation (Managers only)
 * @access Private (MANAGER, ADMIN)
 */
async function rejectApprovalController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Managers or Admins only.",
      });
    }

    const { id } = req.params;
    const { remarks } = req.body || {};

    const approval = await getApprovalById(id);
    if (!approval) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: "Approval request not found.",
      });
    }

    const updated = await updateApprovalStatus(id, {
      status: "REJECTED",
      remarks: remarks || null,
    });

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation rejected successfully.",
      data: {
        record: updated,
      },
    });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to reject quotation.",
      error: error.message,
    });
  }
}

/**
 * @route GET /api/quotations/:quotationId/approvals
 * @description View historical approval steps for a single quotation
 * @access Private (ADMIN, MANAGER, PROCUREMENT_OFFICER)
 */
async function getQuotationApprovalsController(req, res) {
  try {
    const user = await getUserWithRole(req);
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER" && user.role !== "PROCUREMENT_OFFICER")) {
      return sendResponse({
        res,
        statusCode: 403,
        success: false,
        message: "Forbidden. Only procurement officers, managers, or admins can view quotation approvals.",
      });
    }

    const { quotationId } = req.params;
    const history = await getQuotationApprovals(quotationId);

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: "Quotation approval history retrieved successfully.",
      data: {
        items: history,
        total: history.length,
      },
    });
  } catch (error) {
    console.error("Error retrieving quotation approvals history:", error);
    return sendResponse({
      res,
      statusCode: 500,
      success: false,
      message: "Failed to retrieve quotation approvals history.",
      error: error.message,
    });
  }
}

export {
  createApprovalController,
  listApprovalsController,
  getApprovalByIdController,
  approveApprovalController,
  rejectApprovalController,
  getQuotationApprovalsController,
};
